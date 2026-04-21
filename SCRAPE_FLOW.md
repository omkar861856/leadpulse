# Scraper Data Flow & Architecture

This document outlines the end-to-end flow of a scraping request in LeadPulse.

## 1. Request Initiation (Frontend)
- **Path**: `src/app/dashboard/scraper/page.tsx`
- **Action**: User enters a keyword or URL and clicks "Search".
- **Trigger**: Sends a POST request to `/api/scrape`.
- **Background**: The UI enters a `Loading` state, but the process continues on the server even if the tab is switched.

## 2. Scraping Phase (Backend)
- **Path**: `src/app/api/scrape/route.ts`
- **Scraper Engine**: Connects to an external Crawl4AI instance (`SCRAPER_URL`).
- **Functionality**:
    - **Search Mode**: Generates a Google Search URL and scrapes the results in Markdown format.
    - **URL Mode**: Directly scrapes the provided URL and converts it to Markdown.
    - **Optimization**: Uses `f: 'fit'` to strip HTML bloat (scripts, styles, headers).

## 3. AI Extraction Phase (LLM)
- **Path**: `src/app/api/scrape/route.ts` -> `src/lib/llm.ts`
- **Engine**: Ollama / Open WebUI running `qwen2.5:1.5b`.
- **System Prompt**: Instructs the model to act as a precise data extractor.
- **Task**: The LLM parses the Raw Markdown and identifies business leads (Name, Location, Website, etc.).
- **Output Format**: Enforces a strict `SUMMARY: [text]` and `LEADS: [JSON]` structure.

## 4. Post-Processing & Persistence
- **Regex Parsing**: Extracts the summary and JSON array from the LLM's text response.
- **Database Entry**:
    - Saves the search metadata to the `scrapes` collection.
    - Automatically syncs found leads into the `leads` collection for use in Campaigns.
- **Activity Log**: Logs the action in the `activities` collection.

## 5. Result Display & Enrichment
- **UI Update**: Scraper results are displayed on the frontend.
- **Auto-Enrichment**: Triggers an automatic secondary scrape for each lead found to find deep contact details (Emails, Phones, Socials).
- **Enrichment API**: `/api/scrape/enrich` uses a similar LLM flow but focused on finding contact info.

## 6. Recovery & Persistence
- **On Mount**: Every time the Scraper page loads, it calls `GET /api/scrape` to restore the last session's state from MongoDB.
