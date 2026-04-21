# LeadPulse Database Schema

This document outlines the MongoDB collection structures used in the LeadPulse application.

## Database: `leadpulse`

### 1. `leads`
Stores leads that have been saved or added to campaigns.
- `userId` (String): Clerk User ID.
- `id` (String): Unique lead identifier.
- `name` (String): Business/Lead name.
- `industry` (String): Primary category.
- `location` (String): Geographic or digital location.
- `email` (String): Contact email.
- `phone` (String): Contact phone.
- `website` (String): Official website.
- `status` (String): Status of outreach (e.g., "connected", "pending").
- `createdAt` (Date): Timestamp of creation.

### 2. `scrapes`
Stores the history and results of scraping sessions.
- `userId` (String): Clerk User ID.
- `keyword` (String): The search query used.
- `mode` (String): "search" or "url".
- `isFallback` (Boolean): True if AI simulation was used.
- `date` (Date): Timestamp of the scrape.
- `resultsCount` (Number): Number of leads discovered.
- `summary` (String): AI-generated market insight.
- `leads` (Array): Snapshot of discovered leads.

### 3. `usage_limits`
Tracks daily usage per user to enforce limits.
- `userId` (String): Clerk User ID.
- `date` (String): YYYY-MM-DD format.
- `count` (Number): Number of searches performed today.

### 4. `activities`
Logs all significant user interactions within the platform.
- `userId` (String): Clerk User ID.
- `type` (String): Type of activity (e.g., "scrape_attempt", "lead_saved", "campaign_view").
- `description` (String): Human-readable summary.
- `metadata` (Object): Contextual data (e.g., query, leadId).
- `timestamp` (Date): Timestamp.
