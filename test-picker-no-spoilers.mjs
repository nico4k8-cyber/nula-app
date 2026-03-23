import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  
  // Select age group to get to picker
  await page.click("button:has-text('13–16')");
  await page.waitForTimeout(500);
  
  // Take screenshot of picker
  await page.screenshot({ path: "picker-no-spoilers.png", fullPage: false });
  console.log("✓ Picker screenshot saved");
  
} finally {
  await browser.close();
}
