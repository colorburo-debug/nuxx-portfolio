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

    await page.waitForTimeout(2000);

    // Screenshot of Journey section focusing on title-image gaps
    const journeySection = page.locator('.journey-section');
    await journeySection.evaluate(node => node.scrollIntoView());

    await page.screenshot({
        path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/journey_bottom_gaps_30px.png',
        fullPage: false
    });
    console.log('Saved journey_bottom_gaps_30px.png');

    await browser.close();
})();
