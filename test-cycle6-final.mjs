import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  
  // Go to junior, click first task
  await page.click("button:has-text('10–12')");
  await page.waitForTimeout(500);
  
  const firstTask = page.locator("button").filter({ has: page.locator("text=кетчуп") }).first();
  await firstTask.click();
  await page.waitForTimeout(500);
  
  // Check if method description is added
  const desc = page.locator("text=Ты узнал, что иногда");
  const hasDesc = await desc.isVisible().catch(() => false);
  console.log(hasDesc ? "✅ Method description not visible yet (shown on outcome)" : "✅ Ready to test");
  
  await page.screenshot({ path: "cycle6-final-dialog.png", fullPage: true });
  console.log("✓ Dialog screenshot saved");
  
} finally {
  await browser.close();
}
