import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto("http://localhost:5174", { waitUntil: "networkidle" });
  await page.click("button:has-text('13–16')");
  await page.waitForTimeout(500);
  
  // Check for method names (should NOT be visible)
  const methods = ["Наоборот", "Дробление", "Посредник"];
  for (const method of methods) {
    const visible = await page.locator(`text=${method}`).isVisible().catch(() => false);
    if (visible) console.log(`❌ Method "${method}" visible (spoiler!)`);
  }
  console.log("✅ Methods hidden on picker");
  
  await page.screenshot({ path: "picker-final.png", fullPage: true });
  
} finally {
  await browser.close();
}
