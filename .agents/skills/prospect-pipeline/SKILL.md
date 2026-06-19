---
name: prospect-pipeline
description: Manage the end-to-end Amazon listing optimization pipeline
---

# prospect-pipeline Skill

Use this skill to guide you through managing prospect ingestion, ASIN scraping, AI listing analysis, and outreach copywriting.

## Prospect Lifecycle States

1. **`new`**: Newly imported from Apollo; no scraping or analysis done.
2. **`scraped`**: Product listing data scraped successfully from Amazon.
3. **`analyzing`**: Active job running in the queue.
4. **`analyzed`**: Rufus/Cosmo/Semantic scores calculated and saved.
5. **`drafted`**: AI outreach email sequence generated and saved locally.
6. **`emailed`**: Approved by agent; contact enrolled in Apollo sequence.
7. **`replied`**: Contact replied (tracked via webhook).

## Ingestion and Targeting

### Ingestion Flow
1. Fetch target contacts from Apollo matching target personas (Amazon/E-commerce managers).
2. Save contact info and ASIN to local database (status: `new`).
3. Classify prospects by monthly/annual revenue:
   - **`Class_A`**: Enterprise tier (>$1M monthly/annual)
   - **`Class_B`**: Growth tier (>$100K monthly/annual)
   - **`Class_C`**: Starter tier (<$100K monthly/annual)

### Triggering Listing Analysis
Enqueues the Amazon scraping and AI analysis pipeline:
`npx tsx scripts/agent/trigger-pipeline.ts --prospect-id=<id> --asin=<asin>`

The pipeline runs through 6 distinct stages asynchronously:
1. **`fetch`**: Scrapes listing via Apify/Rainforest API.
2. **`preprocess`**: Parses raw HTML, images, bullet points, description, A+ content.
3. **`embedding`**: Generates text embeddings using OpenAI Ada-002.
4. **`semantic`**: Compares listing with ideal search queries in Qdrant.
5. **`optimize`**: Evaluates gaps in Cosmo/Rufus search query compliance.
6. **`competitor`**: Analyzes listings of top competitors.

## Review and Approval Playbook

1. **Verify Analysis Scores**
   Run `npx tsx scripts/agent/prospect-detail.ts --id=<prospectId>`
   Confirm that overall score, Rufus score, Cosmo score, and gaps were successfully populated.

2. **Verify Outreach Copy**
   Confirm that `outreachEmails` field is populated. If needed, the copy can be regenerated via tRPC.

3. **Approve and Enroll**
   Submit approval to enroll the prospect into the sequence:
   `npx tsx scripts/agent/approve-outreach.ts --id=<prospectId>`
   This syncs custom scores to Apollo and places the contact in the outreach funnel.
