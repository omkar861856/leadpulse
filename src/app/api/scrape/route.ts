import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { logActivity } from '@/lib/activity';
import { withRetry } from '@/lib/retry';
import { chatCompletion } from '@/lib/llm';


export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const body = await req.json();
        const { mode, keyword, location, url } = body;
        const email = user.emailAddresses[0]?.emailAddress;

        // 1. Connection & Scraper Setup
        sendEvent('status', { message: 'Connecting to Scraping Engine...' });
        const client = await clientPromise;
        const db = client.db('leadpulse');
        const scraperUrl = process.env.SCRAPER_URL;
        if (!scraperUrl) throw new Error("SCRAPER_URL not configured");

        let markdown = "";
        let isFallback = false;

        // 2. Scraping Phase
        sendEvent('status', { message: `Retrieving content from ${mode === 'url' ? 'URL' : 'search results'}...` });
        
        const scrapeTarget = mode === 'url' ? url : `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
        try {
          const crawlResponse = await fetch(`${scraperUrl}/md`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url: scrapeTarget, 
              f: 'fit',
              css_selector: 'main, #search, .results',
              word_count_threshold: 10,
              exclude_external_links: true
            }),
            signal: AbortSignal.timeout(60000)
          });

          if (crawlResponse.ok) {
            const data = await crawlResponse.json();
            markdown = data.markdown || data.results?.[0]?.markdown || "";
            sendEvent('status', { message: 'Content retrieved successfully.', debugMarkdown: markdown.substring(0, 500) });
          } else {
            throw new Error(`Scraper returned ${crawlResponse.status}`);
          }
        } catch (err) {
          console.warn("Scraper failed, using fallback", err);
          isFallback = true;
          sendEvent('status', { message: 'Scraper engine delayed. Using AI fallback mode.', isFallback: true });
        }

        // 3. AI Extraction Phase (Streaming)
        sendEvent('status', { message: 'Analyzing content with AI...' });
        const systemPrompt = "You are a data extraction robot. ONLY output the following format. NO conversation. NO preamble.\n\nSUMMARY: [Market overview]\nLEADS: [JSON array of businesses]";
        const prompt = `CONTENT:\n${markdown.substring(0, 3000)}\n\nFORMAT:\nSUMMARY: ...\nLEADS: [{"name":"...","industry":"...","location":"...","website":"..."}]`;

        let fullAiResponse = "";
        await chatCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ], (chunk) => {
          fullAiResponse += chunk;
          sendEvent('token', { chunk });
        });

        // 4. Parsing Phase
        sendEvent('status', { message: 'Extracting structured data...' });
        let summary = "Analysis complete.";
        let leads = [];

        try {
          const summaryMatch = fullAiResponse.match(/SUMMARY:\s*([\s\S]*?)(?=LEADS:|$)/i);
          if (summaryMatch) summary = summaryMatch[1].trim();

          const jsonSectionMatch = fullAiResponse.match(/LEADS:\s*([\s\S]*)/i);
          if (jsonSectionMatch) {
             const rawJson = jsonSectionMatch[1].trim();
             const firstBracket = rawJson.indexOf('[');
             const lastBracket = rawJson.lastIndexOf(']');
             if (firstBracket !== -1 && lastBracket !== -1) {
                 const cleanJson = rawJson.substring(firstBracket, lastBracket + 1)
                                    .replace(/```json|```/g, '')
                                    .replace(/[\u201C\u201D]/g, '"');
                 leads = JSON.parse(cleanJson);
             }
          }
        } catch (err) {
          console.error("Parsing failed", err);
        }

        // 5. Persistence Phase
        sendEvent('status', { message: 'Saving session to database...' });
        await db.collection('scrapes').insertOne({
          userId, mode, keyword: keyword || url, location: location || 'Global',
          timestamp: new Date(), resultsCount: leads.length, leads, summary,
          rawResponse: fullAiResponse, status: 'completed'
        });

        if (leads.length > 0) {
          sendEvent('status', { message: `Syncing ${leads.length} leads to CRM...` });
          for (const lead of leads) {
            const normalizedName = (lead.name || '').toLowerCase().trim();
            const normalizedWebsite = (lead.website || '').toLowerCase().replace(/https?:\/\/|www\./g, '').split('/')[0] || '';
            const query: any = { userId };
            if (normalizedWebsite) {
              query.$or = [{ website: { $regex: normalizedWebsite, $options: 'i' } }, { name: { $regex: `^${normalizedName}$`, $options: 'i' } }];
            } else {
              query.name = { $regex: `^${normalizedName}$`, $options: 'i' };
            }

            await db.collection('leads').updateOne(
              query,
              { 
                $set: { ...lead, updatedAt: new Date(), source: 'Streaming Scrape' },
                $setOnInsert: { createdAt: new Date(), status: 'scraped' } 
              },
              { upsert: true }
            );
          }
        }

        await logActivity(userId, 'scrape_request', `Streaming complete for "${keyword || url}"`, { results: leads.length });
        
        // Final Event
        sendEvent('complete', { leads, summary, isFallback, debugMarkdown: markdown });
        controller.close();

      } catch (error: any) {
        console.error('Streaming API Error:', error);
        sendEvent('error', { message: error.message || 'Workflow interrupted' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db('leadpulse');
    
    // Get the latest scrape for this user
    const latestScrape = await db.collection('scrapes')
      .find({ userId })
      .sort({ date: -1 })
      .limit(1)
      .toArray();

    if (latestScrape.length === 0) {
      return NextResponse.json({ message: 'No recent scrapes found' }, { status: 404 });
    }

    return NextResponse.json(latestScrape[0]);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
