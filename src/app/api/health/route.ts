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

  try {
    // Check Scraper (Simple GET check if possible, or just HEAD)
    const scraperUrl = process.env.SCRAPER_URL || 'http://187.127.151.199:32768';
    const scraperRes = await fetch(scraperUrl, { signal: AbortSignal.timeout(2000) });
    if (scraperRes.ok || scraperRes.status === 404 || scraperRes.status === 405) {
      status.scraper = 'up';
    }
  } catch (err) {
    status.scraper = 'down';
  }

  try {
    // Check LLM (tags endpoint for Ollama)
    const llmUrl = process.env.LLM_BASE_URL?.replace('/v1', '/api/tags') || 'http://localhost:11434/api/tags';
    const llmRes = await fetch(llmUrl, { signal: AbortSignal.timeout(2000) });
    if (llmRes.ok) {
      status.llm = 'up';
    }
  } catch (err) {
    status.llm = 'down';
  }

  return NextResponse.json(status);
}
