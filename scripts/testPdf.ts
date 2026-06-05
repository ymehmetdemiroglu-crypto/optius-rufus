import { generatePdf } from "../api/services/pdf.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("🚀 Starting PDF generation test for 'mock-prospect'...");
  
  // Make sure we point APP_URL to local server
  process.env.APP_URL = "http://127.0.0.1:5173";
  
  try {
    const pdfBuffer = await generatePdf("mock-prospect");
    const outputPath = path.resolve(__dirname, "../scratch/mock-audit.pdf");
    
    // Create scratch dir if it doesn't exist
    const scratchDir = path.dirname(outputPath);
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ PDF generated successfully and saved to: ${outputPath}`);
    console.log(`📄 Size: ${pdfBuffer.length} bytes`);
  } catch (err) {
    console.error("❌ PDF generation test failed:", err);
    process.exit(1);
  }
}

main();
