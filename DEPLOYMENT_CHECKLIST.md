# 🚀 Deployment Checklist

Before every push to `main`, ensure the following steps are completed:

## 1. Type Safety & Imports
- [ ] No missing imports (especially `NextRequest`, `NextResponse` in API routes).
- [ ] No `any` types where precision is required.
- [ ] Run `npm run build` or `npx tsc --noEmit` to verify type integrity.

## 2. Authentication & Authorization
- [ ] All API routes in `src/app/api` have `auth()` or `currentUser()` guards.
- [ ] Administrative routes (like `/api/database`) have strict email-based `ADMIN_EMAILS` checks.
- [ ] Unused components or diagnostic pages (like Database UI) are removed from the client-side navigation.

## 3. Secret Management
- [ ] No hardcoded passwords or API keys (checked via `grep`).
- [ ] All infrastructure fallbacks (IPs, URLs) removed.
- [ ] `.gitignore` contains `.env*` and `/scratch`.

## 4. UI/UX Consistency
- [ ] All "Coming Soon" features are properly locked.
- [ ] No React "unique key" warnings in the console.
- [ ] Correct Clerk components used (e.g., modern `UserButton` without deprecated props).

## 5. Persistence
- [ ] MongoDB connection optimized (no double-instantiation in HMR).
- [ ] Schema audits (Check for `createdAt`, `userId` in all synced collections).
