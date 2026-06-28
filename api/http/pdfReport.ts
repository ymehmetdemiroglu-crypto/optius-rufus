import type { Context } from "hono";
import { getProspectBySlug } from "../domains/prospect/service.js";
import { logger } from "../infra/logger.js";

export async function renderPdfReportHtml(c: Context) {
  const slug = c.req.param("slug");
  try {
    const data = await getProspectBySlug(slug || "");
    const { prospect, listing, analysis } = data;

    if (!prospect) {
      return c.text("Prospect not found", 404);
    }

    const name = prospect.firstName ? `${prospect.firstName} ${prospect.lastName || ""}`.trim() : prospect.email;
    const companyName = prospect.company || "Your Brand";
    const asin = listing?.asin || prospect.asin || "N/A";
    const title = listing?.title || "Product Listing";
    const brand = listing?.brand || companyName;
    const price = listing?.price ? `$${listing.price.toFixed(2)}` : "N/A";
    const category = listing?.category || "Product Category";
    
    const rufusScore = analysis?.rufusScore ?? 0;
    const cosmoScore = analysis?.cosmoScore ?? 0;
    const overallScore = analysis?.overallScore ?? Math.round((rufusScore + cosmoScore) / 2);

    // Classification
    const revenue = prospect.expectedRevenue || "";
    let tierText = "Starter Brand";
    if (revenue.includes("Class_A") || revenue.toLowerCase().includes("enterprise")) {
      tierText = "Enterprise Brand";
    } else if (revenue.includes("Class_B") || revenue.toLowerCase().includes("growth")) {
      tierText = "Growth Brand";
    }

    // Gaps and Intents parsing
    let gaps: any[] = [];
    if (analysis?.gaps) {
      gaps = typeof analysis.gaps === "string" ? JSON.parse(analysis.gaps) : analysis.gaps;
    } else if (analysis && (analysis as any).semanticGaps) {
      gaps = (analysis as any).semanticGaps;
    }

    let predictedIntents: any[] = [];
    if (analysis?.aiAnalysisRaw) {
      try {
        const raw = typeof analysis.aiAnalysisRaw === "string" ? JSON.parse(analysis.aiAnalysisRaw) : analysis.aiAnalysisRaw;
        predictedIntents = raw?.predictedIntents || [];
      } catch {
        // Ignored
      }
    }
    if (predictedIntents.length === 0 && (analysis as any).predictedIntents) {
      predictedIntents = (analysis as any).predictedIntents;
    }

    // Competitors
    let competitors: any[] = [];
    if (analysis?.copyCompetitorAudit) {
      try {
        competitors = JSON.parse(analysis.copyCompetitorAudit);
      } catch {
        // Ignored
      }
    }

    // Scenarios
    let scenarios: any[] = [];
    if (analysis?.copySimulatorScenarios) {
      scenarios = typeof analysis.copySimulatorScenarios === "string" ? JSON.parse(analysis.copySimulatorScenarios) : analysis.copySimulatorScenarios;
    }

    // SVG Score Circle helper
    const getSvgCircle = (score: number, label: string, color: string) => {
      const radius = 50;
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (score / 100) * circumference;
      return `
        <div class="score-circle-container">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="12"></circle>
            <circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="12" 
                    stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                    stroke-linecap="round" transform="rotate(-90 60 60)"></circle>
            <text x="60" y="66" text-anchor="middle" font-weight="900" font-size="22" fill="#1a202c">${score}</text>
          </svg>
          <span class="score-circle-label">${label}</span>
        </div>
      `;
    };

    const formattedDate = new Date(analysis?.createdAt || Date.now()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>AEO Audit Report - ${asin}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --brand-dark: #1a202c;
          --brand-gold: #b8860b;
          --brand-light-gold: #fcf8eb;
          --brand-bg: #f8f9fa;
          --brutal-border: 3px solid var(--brand-dark);
          --brutal-shadow: 4px 4px 0px var(--brand-dark);
          --brutal-shadow-sm: 2px 2px 0px var(--brand-dark);
          --critical: #ef4444;
          --high: #f97316;
          --medium: #eab308;
          --low: #3b82f6;
        }

        @page {
          size: A4;
          margin: 15mm;
          @bottom-right {
            content: counter(page);
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
          background-color: #ffffff;
          color: var(--brand-dark);
          line-height: 1.5;
          font-size: 13px;
        }

        h1, h2, h3, h4 {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .page-ready-signal {
          display: none;
        }

        .report-page {
          page-break-after: always;
          width: 100%;
          min-height: 260mm;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .report-page:last-child {
          page-break-after: avoid;
        }

        /* Cover Page */
        .cover-page {
          justify-content: space-between;
          border: var(--brutal-border);
          padding: 40px;
          background-color: var(--brand-light-gold);
          box-shadow: var(--brutal-shadow);
        }

        .cover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: var(--brutal-border);
          padding-bottom: 20px;
        }

        .logo {
          font-family: 'Outfit', sans-serif;
          font-size: 26px;
          font-weight: 900;
          color: var(--brand-dark);
          letter-spacing: -0.04em;
          border: 3px solid var(--brand-dark);
          padding: 5px 15px;
          background: #ffffff;
          box-shadow: var(--brutal-shadow-sm);
        }

        .badge-tier {
          font-size: 11px;
          font-weight: 800;
          background-color: var(--brand-dark);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 0;
          border: 2px solid var(--brand-dark);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .cover-title-container {
          margin: 60px 0;
          max-width: 90%;
        }

        .cover-subtitle {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: var(--brand-gold);
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .cover-title {
          font-size: 42px;
          line-height: 1.1;
          margin-bottom: 20px;
          color: var(--brand-dark);
          -webkit-text-stroke: 1px var(--brand-dark);
        }

        .cover-meta {
          border-top: var(--brutal-border);
          padding-top: 30px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .meta-box h4 {
          font-size: 10px;
          color: #718096;
          margin-bottom: 5px;
        }

        .meta-box p {
          font-size: 14px;
          font-weight: 700;
        }

        /* Score Panel */
        .score-panel {
          border: var(--brutal-border);
          padding: 25px;
          background: #ffffff;
          box-shadow: var(--brutal-shadow);
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 30px 0;
        }

        .score-circle-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .score-circle-label {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--brand-dark);
        }

        /* Content Pages */
        .section-header {
          border-bottom: var(--brutal-border);
          padding-bottom: 15px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .section-header h2 {
          font-size: 24px;
        }

        .section-header .subtitle {
          font-size: 11px;
          color: #718096;
          font-weight: 700;
        }

        .explanation-card {
          border: var(--brutal-border);
          background: #ffffff;
          padding: 20px;
          margin-bottom: 25px;
          box-shadow: var(--brutal-shadow-sm);
        }

        .explanation-card p {
          font-size: 13px;
          line-height: 1.6;
        }

        /* Table Brutal */
        .table-brutal {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          border: var(--brutal-border);
          box-shadow: var(--brutal-shadow-sm);
        }

        .table-brutal th, .table-brutal td {
          border: var(--brutal-border);
          padding: 10px 15px;
          text-align: left;
        }

        .table-brutal th {
          background-color: var(--brand-dark);
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-brutal tr:nth-child(even) td {
          background-color: #f7fafc;
        }

        .priority-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          color: #ffffff;
          border: 2px solid var(--brand-dark);
        }

        .priority-critical { background-color: var(--critical); }
        .priority-high { background-color: var(--high); }
        .priority-medium { background-color: var(--medium); color: var(--brand-dark); }
        .priority-low { background-color: var(--low); }

        /* Simulator Card */
        .sim-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
        }

        .sim-card {
          border: var(--brutal-border);
          padding: 15px;
          background: #ffffff;
          box-shadow: var(--brutal-shadow-sm);
        }

        .sim-card-header {
          border-bottom: 2px solid var(--brand-dark);
          padding-bottom: 10px;
          margin-bottom: 10px;
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
        }

        .sim-bubble-prospect {
          background-color: #fee2e2;
          border: 2px solid var(--brand-dark);
          padding: 8px 12px;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .sim-bubble-comp {
          background-color: #dcfce7;
          border: 2px solid var(--brand-dark);
          padding: 8px 12px;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .cta-section {
          border: var(--brutal-border);
          background-color: var(--brand-gold);
          color: var(--brand-dark);
          padding: 25px;
          text-align: center;
          margin-top: auto;
          box-shadow: var(--brutal-shadow);
        }

        .cta-section h3 {
          font-size: 20px;
          margin-bottom: 8px;
        }

        .cta-section p {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 15px;
        }

        .cta-btn {
          display: inline-block;
          background-color: var(--brand-dark);
          color: #ffffff;
          border: 2px solid var(--brand-dark);
          padding: 10px 25px;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-decoration: none;
          box-shadow: 3px 3px 0px #ffffff;
        }

        .badge-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .keyword-badge {
          font-size: 9px;
          font-weight: 700;
          border: 1.5px solid var(--brand-dark);
          padding: 2px 6px;
          background-color: #edf2f7;
        }
        .keyword-badge.matched {
          background-color: #dcfce7;
          color: #166534;
        }
        .keyword-badge.missing {
          background-color: #fee2e2;
          color: #991b1b;
        }

      </style>
    </head>
    <body>
      <div class="report-ready page-ready-signal"></div>

      <!-- PAGE 1: COVER -->
      <div class="report-page cover-page">
        <div class="cover-header">
          <div class="logo">OPTIMUS RUFUS</div>
          <div class="badge-tier">${tierText}</div>
        </div>

        <div class="cover-title-container">
          <p class="cover-subtitle">Answer Engine Optimization (AEO) Report</p>
          <h1 class="cover-title">RUFUS & COSMO<br>COMPATIBILITY AUDIT</h1>
          <div class="badge-tier" style="background-color: var(--brand-gold); margin-top: 10px; display: inline-block;">
            ASIN: ${asin}
          </div>
        </div>

        <div class="score-panel">
          ${getSvgCircle(overallScore, "Overall Score", "var(--brand-gold)")}
          ${getSvgCircle(rufusScore, "Rufus Score", "#ef4444")}
          ${getSvgCircle(cosmoScore, "COSMO Score", "#3b82f6")}
        </div>

        <div class="cover-meta">
          <div class="meta-box">
            <h4>AUDIT TARGET</h4>
            <p>${brand}</p>
          </div>
          <div class="meta-box">
            <h4>CATEGORY</h4>
            <p>${category.split("&")[0].trim()}</p>
          </div>
          <div class="meta-box">
            <h4>DATE GENERATED</h4>
            <p>${formattedDate}</p>
          </div>
        </div>
      </div>

      <!-- PAGE 2: SEMANTIC GAPS -->
      <div class="report-page" style="padding: 20px 0;">
        <div class="section-header">
          <h2>Semantic Gap & Intent Analysis</h2>
          <span class="subtitle">Section 01 / Diagnostics</span>
        </div>

        <div class="explanation-card">
          <p>
            <strong>What is a Semantic Gap?</strong> Amazon's conversational assistant, Rufus, does not rely on simple keyword stuffing. It queries a complex, common-sense knowledge graph (COSMO) that links buyer intents to product attributes. A semantic gap exists when your product attributes do not align with what Rufus expects to answer customer questions, causing it to recommend competitors.
          </p>
        </div>

        <h3>Critical Gaps Identified</h3>
        <table class="table-brutal">
          <thead>
            <tr>
              <th style="width: 25%;">Dimension</th>
              <th style="width: 15%;">Score</th>
              <th style="width: 15%;">Priority</th>
              <th style="width: 45%;">Copywriting Recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${gaps.slice(0, 5).map((gap: any) => `
              <tr>
                <td><strong>${gap.dimension.replace(/_/g, " ")}</strong></td>
                <td>${Math.round((gap.currentScore || 0) * 100)} / 100</td>
                <td><span class="priority-badge priority-${gap.priority || "medium"}">${gap.priority || "medium"}</span></td>
                <td>${gap.recommendation}</td>
              </tr>
            `).join("")}
            ${gaps.length === 0 ? `<tr><td colspan="4" style="text-align: center;">No critical gaps found. Your listing is fully optimized.</td></tr>` : ""}
          </tbody>
        </table>
      </div>

      <!-- PAGE 3: CONVERSATIONAL SEARCH SIMULATOR & COMPETITORS -->
      <div class="report-page" style="padding: 20px 0;">
        <div class="section-header">
          <h2>conversational search simulation</h2>
          <span class="subtitle">Section 02 / Competitor Parity</span>
        </div>

        <div class="explanation-card">
          <p>
            We simulated real conversational shopping paths inside Rufus. The results show that when shoppers ask Rufus questions comparing products in your category, Rufus redirects traffic to your competitors due to missing trust and safety signals in your copy.
          </p>
        </div>

        <h3>Simulated Shopper Path</h3>
        <div class="sim-grid">
          ${scenarios.slice(0, 2).map((s: any) => `
            <div class="sim-card">
              <div class="sim-card-header">Query: "${s.buyerQuestion || "Product query"}"</div>
              <div class="sim-bubble-prospect">
                <strong>Your Listing State:</strong><br>
                ❌ Rufus fails to cite your product. Reason: <em>${s.failReason || "Missing product context"}</em>.
              </div>
              <div class="sim-bubble-comp">
                <strong>Redirect Target:</strong><br>
                👉 recommended: <strong>${s.competitorName || "Competitor Product"}</strong><br>
                Why: "${s.competitorAdvantage || "Detail-rich bullets"}"
              </div>
            </div>
          `).join("")}
          ${scenarios.length === 0 ? `
            <div class="sim-card" style="grid-column: span 2; text-align: center; padding: 30px;">
              No simulator scenarios generated.
            </div>
          ` : ""}
        </div>

        <h3 style="margin-top: 30px;">Top Competitor Score Benchmarks</h3>
        <table class="table-brutal">
          <thead>
            <tr>
              <th>ASIN</th>
              <th>Brand / Name</th>
              <th>Price</th>
              <th>Rating</th>
              <th>Rufus Match</th>
            </tr>
          </thead>
          <tbody>
            ${competitors.slice(0, 4).map((comp: any) => `
              <tr>
                <td><code>${comp.asin}</code></td>
                <td>${comp.brand || "Competitor"}</td>
                <td>$${comp.price || "N/A"}</td>
                <td>⭐ ${comp.rating || "N/A"}</td>
                <td><strong>${comp.score || 0} / 100</strong></td>
              </tr>
            `).join("")}
            ${competitors.length === 0 ? `<tr><td colspan="5" style="text-align: center;">No competitors analyzed.</td></tr>` : ""}
          </tbody>
        </table>
      </div>

      <!-- PAGE 4: INTENT COVERAGE & ACTIONABLE ROADMAP -->
      <div class="report-page" style="padding: 20px 0;">
        <div class="section-header">
          <h2>Intent Coverage Signals & Roadmap</h2>
          <span class="subtitle">Section 03 / Optimization Roadmap</span>
        </div>

        <h3>Predicted Buyer Intents</h3>
        <table class="table-brutal" style="margin-bottom: 25px;">
          <thead>
            <tr>
              <th style="width: 30%;">Buyer Question</th>
              <th style="width: 20%;">Journey Stage</th>
              <th style="width: 50%;">Keywords & Signals (Matched / Missing)</th>
            </tr>
          </thead>
          <tbody>
            ${predictedIntents.slice(0, 4).map((pi: any) => `
              <tr>
                <td>"${pi.query}"</td>
                <td><span style="font-weight: 700; font-size: 10px; text-transform: uppercase;">${pi.journey || "informational"}</span></td>
                <td>
                  <div class="badge-list" style="margin-bottom: 5px;">
                    ${(pi.signals || []).map((s: string) => `<span class="keyword-badge matched">${s}</span>`).join("")}
                  </div>
                  <div class="badge-list">
                    ${(pi.missingSignals || []).map((s: string) => `<span class="keyword-badge missing">${s}</span>`).join("")}
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="cta-section">
          <h3>Let's Plug These Semantic Gaps</h3>
          <p>We have pre-drafted the fully optimized listing copy that solves these gaps and increases your Rufus Compatibility score to over 85.</p>
          <a href="${process.env.VITE_CALENDLY_URL || "https://calendly.com/optimusrufus"}" class="cta-btn">Book Your Implementation Call →</a>
        </div>
      </div>

    </body>
    </html>
    `;
    return c.html(html);
  } catch (err: any) {
    logger.error("Failed to render PDF Report HTML", { error: err.message, slug });
    return c.text("Internal Server Error: " + err.message, 500);
  }
}
