import puppeteer from "puppeteer";
import fs from "fs";

async function verify() {
  const url = "http://localhost:5173/p/nutrawell-b07t7h5c5r";
  console.log("🌐 Navigating to: " + url);

  const launchOptions: any = {
    headless: true,
    args: ["--no-sandbox"]
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else if (process.platform === "win32") {
    const defaultWinPath = "C:\\Users\\hp\\.cache\\puppeteer\\chrome-headless-shell\\win64-148.0.7778.97\\chrome-headless-shell-win64\\chrome-headless-shell.exe";
    if (fs.existsSync(defaultWinPath)) {
      launchOptions.executablePath = defaultWinPath;
    }
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  console.log("🖱️ Clicking scan button...");
  await page.waitForSelector("button.brutalist-btn");
  await page.click("button.brutalist-btn");

  console.log("⏳ Waiting 5 seconds for scan animation to complete...");
  await new Promise((r) => setTimeout(r, 5500));

  console.log("🔍 Inspecting booking section (#stage-book)...");
  await page.waitForSelector("#stage-book");

  // Extract the text of the booking section headline
  const headline = await page.$eval("#stage-book h2", (el) => el.textContent?.trim());
  console.log("📝 RENDERED HEADLINE:");
  console.log("   " + headline);

  // Extract the badge text
  const badge = await page.$eval("#stage-book div.inline-block", (el) => el.textContent?.trim());
  console.log("🏷️ RENDERED BADGE:");
  console.log("   " + badge);

  // Extract the guarantee text
  const guarantee = await page.$eval("#stage-book div.space-y-1 p", (el) => el.textContent?.trim());
  console.log("🛡️ RENDERED GUARANTEE:");
  console.log("   " + guarantee);

  await browser.close();
}

verify().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
