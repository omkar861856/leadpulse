import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { logActivity } from '@/lib/activity';
import { withRetry } from '@/lib/retry';
import { chatCompletion } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.emailAddresses[0]?.emailAddress;
    const { lead } = await req.json();

    if (!lead || (!lead.website && !lead.name)) {
      return NextResponse.json({ error: 'Missing lead details' }, { status: 400 });
    }

    const scraperUrl = process.env.SCRAPER_URL || 'http://187.127.151.199:32768';
    let content = "";
    let subpageContent = "";
    
    // 1. Initial Scrape
    const targetUrl = lead.website || `https://www.google.com/search?q=${encodeURIComponent(lead.name + " " + (lead.location || "") + " contact email phone")}`;
    try {
      const response = await fetch(`${scraperUrl}/md`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, f: 'fit' }),
        signal: AbortSignal.timeout(20000)
      });

      if (response.ok) {
        const data = await response.json();
        content = data.markdown || "";
      }
    } catch (err) {
      console.warn(`Initial enrichment scrape failed for ${lead.name}`, err);
    }

    // 2. Iterative Check: If no contact info, look for "Contact" or "About" links
    if (lead.website && content) {
      const contactLinkMatch = content.match(/\[(?:Contact|About|Team|Reach Out|Get in Touch)\]\(([^)]+)\)/i);
      if (contactLinkMatch) {
         let subpageUrl = contactLinkMatch[1];
         if (subpageUrl.startsWith('/')) {
           const origin = new URL(lead.website).origin;
           subpageUrl = `${origin}${subpageUrl}`;
         }
         
         if (subpageUrl.startsWith('http')) {
            try {
              console.log(`[Enrich] Iterative scrape for ${lead.name}: ${subpageUrl}`);
              const subResponse = await fetch(`${scraperUrl}/md`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: subpageUrl, f: 'fit' }),
                signal: AbortSignal.timeout(15000)
              });
              if (subResponse.ok) {
                const subData = await subResponse.json();
                subpageContent = subData.markdown || "";
              }
            } catch (err) {
              console.warn(`Subpage scrape failed for ${subpageUrl}`, err);
            }
         }
      }
    }

    // 3. Process Aggregate Content
    const systemPrompt = "You are a precise contact extractor. Return only valid JSON. Do not add intro/outro text.";
    const combinedContent = `${content}\n\n--- SUBPAGE CONTENT ---\n${subpageContent}`.substring(0, 6000);
    
    const prompt = `
      TASK: Extract deep contact info for "${lead.name}".
      JSON FORMAT:
      {
        "email": "...",
        "phone": "...",
        "socials": { "linkedin": "...", "facebook": "...", "instagram": "...", "twitter": "..." },
        "contactPerson": "...",
        "description": "2-sentence summary of what they do",
        "foundOnSubpage": ${subpageContent ? 'true' : 'false'}
      }

      DATA SOURCE:
      ${combinedContent || "No content."}
    `;

    const text = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);
    
    // Robust cleanup for 1.5B models
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
                        .replace(/```json|```/g, '')
                        .trim();
    const enrichedData = JSON.parse(jsonStr);

    await logActivity(userId, 'lead_saved', `Deep Enriched: ${lead.name}`, { leadId: lead.id, email });

    return NextResponse.json({ 
      ...lead,
      ...enrichedData,
      status: 'enriched'
    });

  } catch (error: any) {
    console.error('Enrichment API Error:', error);
    return NextResponse.json({ 
      error: 'Enrichment Failed', 
      message: error.message 
    }, { status: 500 });
  }
}
