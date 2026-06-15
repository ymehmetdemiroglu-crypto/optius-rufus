# Amazon Ads Bulk Sheets (CSV) Generation Specification & Organic Flywheel

To deliver a premium, $1,500+ value service, the PPC module of **Optimus Rufus** must generate a bulk spreadsheet (.xlsx or .csv) that can be uploaded **directly** into Amazon Seller Central with **zero modifications**. 

Uploading this file will automatically build highly optimized, semantically structured Sponsored Products campaigns designed to **boost organic search and Rufus recommendations**.

---

## 1. The Strategy: The Listing-to-PPC Semantic Synergy Loop

Paid traffic (PPC) and organic listings must work in sync to trigger Amazon's organic ranking flywheel. If they are disconnected, conversions drop, ad costs rise, and organic rankings stagnate. 

The software builds campaigns that **directly target the semantic listing updates we made**:

```
 ┌─────────────────────────────────────────────────────────────┐
 |                STEP 1: IDENTIFY SEMANTIC GAPS               |
 |  Analysis parses listing and finds missing intent nodes     |
 |  (e.g., "Leg Cramps" & "Calm Anxiety" are weak/missing).    |
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 |              STEP 2: ON-PAGE OPTIMIZATION                   |
 |  Tool rewrites Title, Bullets & Q&As to inject semantic     |
 |  signals matching those specific missing intent nodes.      |
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 |               STEP 3: COMPLEMENTARY PPC SYNERGY             |
 |  PPC Engine generates Ad Groups targeting those exact nodes |
 |  (e.g., Ad Group A: Leg Cramps | Ad Group B: Calm Anxiety).  |
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 |             STEP 4: ORGANIC RANK ACCELERATION               |
 |  Ad traffic lands on listing containing explicit answers    |
 |  to their pain points -> CVR sky-rockets -> Amazon's COSMO  |
 |  links product to intent -> Organic ranks & Rufus recommend |
 └─────────────────────────────────────────────────────────────┘
```

By focusing our ad spend on the **exact semantic nodes we just optimized the listing for**, we achieve two massive benefits:
1.  **Maximum Conversion Rates (CVR):** When a user clicks an ad for *"magnesium for leg cramps"* and lands on a page with bullet points and Q&As explicitly explaining how the product relieves cramps, they convert instantly.
2.  **AI Indexing Signals:** Amazon's COSMO knowledge graph maps products based on purchase behavior (e.g. *"Product X is purchased under search query 'calf muscle cramps'"*). Driving high-converting ad sales on newly optimized keywords feeds immediate indexing signals to COSMO, unlocking rapid organic rank gains and Rufus recommendations.

---

## 2. Amazon Bulk Sheet Layout Mapping

Amazon's Bulk Operations sheets use specific row-based inheritance. The table below represents the exact CSV rows and columns our `ppcPlannerService.ts` will generate:

| Product | Entity | Operation | Campaign | Ad Group | Bid | Keyword Text | Match Type | SKU / ASIN | Budget / Bidding Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Sponsored Products` | `Campaign` | `create` | `OR_MAG_[ASIN]_COSMO` | | | | | | `50.00` / `Dynamic (down only)` |
| `Sponsored Products` | `Ad Group` | `create` | `OR_MAG_[ASIN]_COSMO` | `Intent_Sleep_Quality` | `1.20` | | | | |
| `Sponsored Products` | `Product Ad` | `create` | `OR_MAG_[ASIN]_COSMO` | `Intent_Sleep_Quality` | | | | `[Client_SKU]` | |
| `Sponsored Products` | `Keyword` | `create` | `OR_MAG_[ASIN]_COSMO` | `Intent_Sleep_Quality` | `1.15` | `magnesium for deep sleep` | `Exact` | | |
| `Sponsored Products` | `Keyword` | `create` | `OR_MAG_[ASIN]_COSMO` | `Intent_Sleep_Quality` | `1.30` | `glycinate sleep aid` | `Exact` | | |
| `Sponsored Products` | `Ad Group` | `create` | `OR_MAG_[ASIN]_COSMO` | `Intent_Leg_Cramps` | `1.00` | | | | |
| `Sponsored Products` | `Product Ad` | `create` | `OR_MAG_[ASIN]_COSMO` | `Intent_Leg_Cramps` | | | | `[Client_SKU]` | |
| `Sponsored Products` | `Keyword` | `create` | `OR_MAG_[ASIN]_COSMO` | `Intent_Leg_Cramps` | `1.05` | `magnesium for leg cramps` | `Exact` | | |

---

## 3. High-Quality Automated Features

### 3.1 AI-Driven Bid Recommendations
The software will calculate bids dynamically for each keyword instead of applying a flat default bid:
*   **High Similarity + High Search Volume:** Set bid higher (e.g., $1.20 - $1.50) to win immediate impressions on high-converting semantic terms.
*   **Low Organic Ranking Proximity (Page 2 Conquesting):** If the client ASIN is on Page 2 organically for a keyword, the system flags this as a "Rank Booster" term and increases the bid by **15%** to drive the conversions needed to break onto Page 1 organically.

### 3.2 Negative Keyword Injection (Budget Defense)
To prevent ad spend bleed, our tool analyzes semantic dimensions that the product does **NOT** match (from the autopsies). It automatically inserts **Campaign Negative Keywords**:
*   *Example:* If the client sells a capsule supplement, the system automatically adds `liquid`, `powder`, `spray`, `gummies` as Campaign-level Negative Phrase keywords.

---

## 4. Software User Workflow (Private Agency Portal)

1.  **Select Client Listing:** You navigate to the Client Profile and select the active ASIN.
2.  **PPC Control Settings Box:**
    *   **SKU/ASIN Input:** Enter the merchant SKU of the listing.
    *   **Daily Budget:** Slide control (Default $50/day).
    *   **Target Bidding Strategy:** Choose between *Dynamic Down Only* (recommended), *Dynamic Up/Down*, or *Fixed Bids*.
3.  **Generate Strategy Review:** The portal displays the Ad Groups, mapped keywords, and bids for review. You can delete or manually override any keyword/bid in the browser table.
4.  **Download Bulk Sheet:** Click **"Export Amazon Bulk Sheet"**. The system instantly downloads the formatted `.xlsx`/`.csv` file.
5.  **Amazon Upload:** You upload this file directly into Seller Central under **Campaign Manager > Bulk Operations > Upload Spreadsheet**.
