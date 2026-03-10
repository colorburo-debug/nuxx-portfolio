const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1024, height: 768 }
    });

    const filePath = `file://${path.resolve(__dirname, 'project-lauhaus.html')}`;
    console.log(`Navigating to: ${filePath}`);
    await page.goto(filePath);

    // Give it a moment to load images and settle
    await page.waitForTimeout(2000);

    // Wait for the journey section to be visible
    const journeySection = page.locator('.journey-section');
    await journeySection.waitFor();

    // Screenshot 1: 1024px
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/specific_gaps_1024.png', fullPage: true });
    console.log('Saved specific_gaps_1024.png');

    // Screenshot 2: 769px
    await page.setViewportSize({ width: 769, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/specific_gaps_769.png', fullPage: true });
    console.log('Saved specific_gaps_769.png');

    await browser.close();
})();
