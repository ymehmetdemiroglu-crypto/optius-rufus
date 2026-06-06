import puppeteer from "puppeteer";
import fs from "fs";

/**
 * Renders the prospect landing page inside headless Chromium and exports a print-optimized PDF.
 */
export async function generatePdf(slug: string): Promise<Buffer> {
  const port = process.env.PORT || "3000";
  // Vite dev server runs on 5173, production binds to 3000
  const appUrl = process.env.APP_URL || 
    (process.env.NODE_ENV === "production" ? `http://127.0.0.1:${port}` : "http://127.0.0.1:5173");
  
  const url = `${appUrl}/p/${slug}?print=true`;
  console.log(`🖨️ [PDFService] Generating PDF for slug: ${slug} at URL: ${url}`);

  const launchOptions: any = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Avoids /dev/shm shared memory exhaustion in Docker
    ],
  };

  // Configure executable path for Puppeteer
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else if (process.platform === "win32") {
    const defaultWinPath = "C:\\Users\\hp\\.cache\\puppeteer\\chrome-headless-shell\\win64-148.0.7778.97\\chrome-headless-shell-win64\\chrome-headless-shell.exe";
    if (fs.existsSync(defaultWinPath)) {
      launchOptions.executablePath = defaultWinPath;
    }
  }

  const browser = await puppeteer.launch(launchOptions);


  try {
    const page = await browser.newPage();
    
    // Log console messages and errors from the browser
    page.on("console", (msg) => console.log(`[Browser Console] ${msg.text()}`));
    page.on("pageerror", (err) => console.error(`[Browser Error] ${(err as any).message || err}`));
    
    // Set viewport size for high resolution printing
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 2,
    });

    // Wait until page is loaded (with retry for transient Windows network changes)
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(url, { waitUntil: "load", timeout: 15000 });
        break;
      } catch (err: any) {
        if ((err as any).message?.includes("ERR_NETWORK_CHANGED") && retries > 1) {
          console.warn(`[PDFService] Encountered ERR_NETWORK_CHANGED. Retrying navigation... (${retries - 1} retries left)`);
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          throw err;
        }
      }
    }

    // Wait for our custom report-ready signal if injected, or fallback after 8 seconds
    try {
      await page.waitForSelector(".report-ready", { timeout: 8000 });
      console.log(`[PDFService] Detected .report-ready selector. Proceeding with print.`);
    } catch {
      console.warn(`[PDFService] .report-ready selector not found within timeout. Printing fallback state.`);
    }

    // Export PDF with standard A4 settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        bottom: "12mm",
        left: "12mm",
        right: "12mm",
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    console.log(`✅ [PDFService] PDF generated successfully for slug: ${slug} (${pdfBuffer.length} bytes)`);
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
