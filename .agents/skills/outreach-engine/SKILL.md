---
name: outreach-engine
description: Manage Apollo.io prospecting, sequence enrollment, and outreach campaigns
---

# outreach-engine Skill

Use this skill to manage Apollo.io contact syncing, custom fields integration, sequence enrollment, and webhook callbacks.

## Apollo Integration Flow

Our outbound machine interacts with Apollo.io via its REST API:

1. **`searchPeople`**: Queries Apollo for leads matching personas.
2. **`enrichAndImport`**: Enriches lead info (emails, company size, revenue) and imports into the database.
3. **`syncCustomFieldsToApollo`**: Pushes the calculated Rufus audit scores and personalized email body copy to Apollo contact custom fields:
   - `rufusScore` (e.g. 64)
   - `topGap` (e.g. "missing safety warnings")
   - `competitorName` (e.g. "Nature's Bounty")
   - `auditUrl` (personalized report page)
   - `customSubject1` / `customBody1` .. `customBody5` (persisted outreach copy)
4. **`enrollInSequence`**: Enrolls the enriched contact in a predefined automated email sequence.

## Sequence Selection Logic

Outreach sequence is determined by the prospect's revenue tier (resolved automatically in `getDefaultSequenceIdForProspect`):

| Revenue Tier | Description | Target Sequence (Configured via Branding) |
|---|---|---|
| **Class_A** | Enterprise ($1M+ / year) | Enterprise Sequence |
| **Class_B** | Growth ($100K - $1M / year) | Growth Sequence |
| **Class_C** | Starter (<$100K / year) | Starter Sequence |

## Managing Copy Changes

### When to Regenerate Copy
- If product information on Amazon changes and a re-analysis job is triggered.
- If the AI writer output was unsatisfactory or needs to test different narrative angles.

### Execution
The copy generator merges:
1. Custom gaps found in listing analysis.
2. Competitor strengths and opportunities.
3. Specific Rufus compliance questions.

## Webhooks & Auto-Analysis

When a contact replies to an email, Apollo sends a webhook to `/api/webhooks/apollo`:
- The daemon parses the callback data.
- If it's a positive reply or a booking request, it logs the activity.
- The webhook handler automatically enqueues a new analysis job to refresh listing metrics before any manual follow-up call.
