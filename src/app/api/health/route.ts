import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const status = {
    database: 'down',
    scraper: 'down',
    llm: 'down',
    timestamp: new Date().toISOString()
  };

  try {
    // Check Database
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    status.database = 'up';
  } catch (err) {
    status.database = 'down';
  }

    // Check Scraper
    const scraperUrl = process.env.SCRAPER_URL;
    if (scraperUrl) {
      try {
        const scraperRes = await fetch(scraperUrl, { signal: AbortSignal.timeout(3000) });
        // Accept common live statuses even if root is protected
        if (scraperRes.status < 500) {
          status.scraper = 'up';
        }
      } catch (err) {
        console.warn('Health: Scraper unreachable', err);
        status.scraper = 'down';
      }
    }

    // Check LLM
    const llmUrl = process.env.LLM_BASE_URL?.replace('/v1', '/api/tags');
    if (llmUrl) {
      try {
        const llmRes = await fetch(llmUrl, { signal: AbortSignal.timeout(3000) });
        if (llmRes.ok || llmRes.status === 401) {
          status.llm = 'up';
        }
      } catch (err) {
        console.warn('Health: LLM unreachable', err);
        status.llm = 'down';
      }
    }

  return NextResponse.json(status);
}
