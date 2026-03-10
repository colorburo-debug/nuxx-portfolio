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

    const slider = page.locator('.showcase-split');
    await slider.evaluate(node => node.scrollIntoView());

    // Screenshot 1: Desktop Image Snap
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/refined_slider_snap_1.png' });
    console.log('Saved refined_slider_snap_1.png');

    // Scroll to next snap point
    await slider.evaluate(node => node.scrollTo({ left: 700, behavior: 'instant' }));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/refined_slider_snap_2.png' });
    console.log('Saved refined_slider_snap_2.png');

    // Scroll to last snap point
    await slider.evaluate(node => node.scrollTo({ left: 1400, behavior: 'instant' }));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/jorgegarcia/.gemini/antigravity/brain/a4a765ff-9ef2-44db-ad9a-242254acfd26/refined_slider_snap_3.png' });
    console.log('Saved refined_slider_snap_3.png');

    await browser.close();
})();
