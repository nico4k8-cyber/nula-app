import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  
  // Go to picker
  await page.click("button:has-text('13–16')");
  await page.waitForTimeout(500);
  
  // Click first task
  const firstTask = page.locator("button").filter({ has: page.locator("text=кетчуп") }).first();
  await firstTask.click();
  await page.waitForTimeout(500);
  
  // Check if hint zone is gone
  const hintZone = page.locator("text=Метод:");
  const hintExists = await hintZone.isVisible().catch(() => false);
  console.log(hintExists ? "❌ Hint zone still visible!" : "✅ Hint zone removed");
  
  // Take screenshot
  await page.screenshot({ path: "cycle5-dialog.png", fullPage: true });
  console.log("✓ Screenshot saved");
  
} finally {
  await browser.close();
}
