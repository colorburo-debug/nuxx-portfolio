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

    // Wait for the showcase section to be visible
    const showcaseSection = page.locator('.lauhaus-showcase');
    await showcaseSection.waitFor();
    await showcaseSection.evaluate(node => node.scrollIntoView());

    // Screenshot 1: 1024px (Tablet) - Project Showcase Section
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/showcase_tablet_1024.png', fullPage: false });
    console.log('Saved showcase_tablet_1024.png');

    // Scroll more to see the slider
    const showcaseSplit = page.locator('.showcase-split');
    await showcaseSplit.evaluate(node => node.scrollIntoView());
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/showcase_slider_1024.png', fullPage: false });
    console.log('Saved showcase_slider_1024.png');

    // Screenshot 2: 390px (Mobile) - Ensure hidden
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/showcase_mobile_390.png', fullPage: false });
    console.log('Saved showcase_mobile_390.png');

    await browser.close();
})();
