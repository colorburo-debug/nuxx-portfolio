const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// --- Simple Static File Server ---
const PORT = 8888;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.json': 'application/json',
    '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
    // Decode URI to handle spaces in folder names
    let filePath = path.join(__dirname, '..', decodeURIComponent(req.url));
    if (req.url === '/' || req.url === '') {
        filePath = path.join(__dirname, '..', 'index.html');
    }

    // Remove query params like ?v=cachebust103
    filePath = filePath.split('?')[0];

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error: ' + error.code);
            }
        } else {
            const extname = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[extname] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Local static server running at http://localhost:${PORT}`);
    runTests().catch(err => {
        console.error('Test execution failed:', err);
        server.close();
        process.exit(1);
    });
});

// --- Playwright Verification Script ---
async function runTests() {
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    console.log('Launching Chromium...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Catch page errors
    page.on('pageerror', exception => {
        console.error(`Page error: ${exception.message}`);
    });

    page.on('console', message => {
        if (message.type() === 'error') {
            console.error(`Console error: ${message.text()}`);
        }
    });

    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 812 }
    ];

    // --- Page 1: Landing Page (index.html) ---
    console.log('Testing Landing Page (index.html)...');
    await page.goto(`http://localhost:${PORT}/index.html`);
    
    // Wait for load and GSAP animation trigger (FOUC classes removal)
    await page.waitForTimeout(1000); 

    for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(300); // Wait for transition/relayout
        const screenshotPath = path.join(screenshotDir, `home-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Saved screenshot: ${screenshotPath}`);
    }

    // --- Page 2: About Page (transition via clicking link) ---
    console.log('Testing About Page transition via click...');
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Toggle mobile menu if on mobile, but since we set 1440 viewport we click desktop link
    const aboutLink = page.locator('header .nav-link:text("About")');
    await aboutLink.click();

    // Wait for Barba transition to complete (typically ~1-2 seconds including GSAP curtain)
    console.log('Waiting for transition to complete...');
    await page.waitForTimeout(2000);

    for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(300);
        const screenshotPath = path.join(screenshotDir, `about-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Saved screenshot: ${screenshotPath}`);
    }

    // --- Page 3: Fincas Project Page (direct navigation to test reload) ---
    console.log('Testing Fincas Page (project-fincas.html) direct load...');
    await page.goto(`http://localhost:${PORT}/project-fincas.html`);
    await page.waitForTimeout(1000);

    for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(300);
        const screenshotPath = path.join(screenshotDir, `fincas-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Saved screenshot: ${screenshotPath}`);
    }



    console.log('All tests completed successfully. Closing browser...');
    await browser.close();
    server.close();
    console.log('Static server stopped.');
}
