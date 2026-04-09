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

    // Scroll to the Journey section
    const matrixTitle = page.locator('.matrix-title');
    await matrixTitle.waitFor();
    await matrixTitle.evaluate(node => node.scrollIntoView({ block: 'center' }));

    await page.waitForTimeout(1000);

    // Take screenshot focusing on the gap
    await page.screenshot({
        path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/matrix_gap_verify_100px.png',
        fullPage: false
    });
    console.log('Saved matrix_gap_verify_100px.png');

    await browser.close();
})();
