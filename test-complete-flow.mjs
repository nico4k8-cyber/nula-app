import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  console.log("✓ Age-select loaded");
  
  // Check age select
  await page.screenshot({ path: "flow-1-age.png" });
  await page.click("button:has-text('10–12')");
  await page.waitForTimeout(500);
  
  // Check picker
  console.log("✓ Picker loaded");
  await page.screenshot({ path: "flow-2-picker.png" });
  
  // Check new ПРИЗ stages
  const prizStages = await page.locator("text=❓").isVisible();
  console.log(prizStages ? "✅ ПРИЗ emoji stages visible" : "❌ ПРИЗ stages missing");
  
  // Click a task
  await page.locator("button").filter({ has: page.locator("text=кетчуп") }).first().click();
  await page.waitForTimeout(500);
  
  // Check dialog
  console.log("✓ Dialog loaded");
  const hintZoneText = page.locator("text=Метод:");
  const hintStillThere = await hintZoneText.isVisible().catch(() => false);
  console.log(hintStillThere ? "❌ Hint zone still visible!" : "✅ Hint zone removed");
  
  await page.screenshot({ path: "flow-3-dialog.png", fullPage: false });
  
} finally {
  await browser.close();
}
