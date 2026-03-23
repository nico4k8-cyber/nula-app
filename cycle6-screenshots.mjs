import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  
  // 1. Age select
  console.log("📸 1. Age select...");
  await page.screenshot({ path: "cycle6-1-age.png", fullPage: false });
  
  // 2. Picker
  console.log("📸 2. Picker...");
  await page.click("button:has-text('10–12')");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "cycle6-2-picker.png", fullPage: true });
  
  // 3. Dialog
  console.log("📸 3. Dialog...");
  const firstTask = page.locator("button").filter({ has: page.locator("text=кетчуп") }).first();
  await firstTask.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "cycle6-3-dialog.png", fullPage: true });
  
  // 4. Dialog with message
  console.log("📸 4. Dialog with input...");
  const input = page.locator("input");
  await input.fill("Может кетчуп становится жиже когда его трясёшь?");
  await page.screenshot({ path: "cycle6-4-dialog-input.png", fullPage: true });
  
  console.log("✓ All screenshots ready");
  
} finally {
  await browser.close();
}
