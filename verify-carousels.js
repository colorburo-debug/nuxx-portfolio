const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Load the page
    await page.goto('file:///Users/jorgegarcia/Desktop/Antigravity Projects/Figma test/project-lauhaus.html');

    // Tablet: 1024px
    await page.setViewportSize({ width: 1024, height: 1200 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verify_tablet_full.png', fullPage: true });

    // Mobile: 390px
    await page.setViewportSize({ width: 390, height: 1200 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verify_mobile_full.png', fullPage: true });

    await browser.close();
})();
