import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  
  console.log("📸 Age select");
  await page.screenshot({ path: "c7-1-age.png" });
  
  console.log("📸 Picker");
  await page.click("button:has-text('10–12')");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "c7-2-picker.png", fullPage: true });
  
  console.log("📸 Dialog");
  await page.locator("button").filter({ has: page.locator("text=кетчуп") }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "c7-3-dialog.png", fullPage: true });
  
  // Scroll to input to show it
  await page.locator("input").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "c7-4-input.png", fullPage: false });
  
  console.log("✓ Done");
} finally {
  await browser.close();
}
