const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1024, height: 1000 }
    });

    const filePath = `file://${path.resolve(__dirname, 'project-lauhaus.html')}`;
    await page.goto(filePath);

    await page.waitForTimeout(2000);

    const section = page.locator('.lauhaus-showcase');
    await section.evaluate(node => node.scrollIntoView());

    await page.screenshot({
        path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/showcase_debug_tablet.png'
    });
    console.log('Saved showcase_debug_tablet.png');

    await browser.close();
})();
