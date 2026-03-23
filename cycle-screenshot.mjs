import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  
  // 1. Age select screen
  console.log("📸 Taking age-select screenshot...");
  await page.screenshot({ path: "cycle-age-select.png", fullPage: false });
  
  // 2. Picker screen (senior)
  console.log("📸 Clicking senior...");
  await page.click("button:has-text('13–16')");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "cycle-picker.png", fullPage: true });
  
  // 3. Dialog screen (click first task)
  console.log("📸 Clicking first task...");
  const firstTask = page.locator("button").filter({ has: page.locator("text=кетчуп") }).first();
  await firstTask.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "cycle-dialog.png", fullPage: true });
  
  // 4. Send a message to see hint zone disappear
  console.log("📸 Typing message...");
  const input = page.locator("input[placeholder*='пиши']");
  await input.fill("Может быть, кетчуп становится жиже?");
  await page.screenshot({ path: "cycle-dialog-with-input.png", fullPage: true });
  
  console.log("✓ All screenshots done");
  
} finally {
  await browser.close();
}
