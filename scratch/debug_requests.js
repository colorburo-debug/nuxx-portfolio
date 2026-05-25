const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8889;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', decodeURIComponent(req.url));
    if (req.url === '/' || req.url === '') {
        filePath = path.join(__dirname, '..', 'index.html');
    }
    filePath = filePath.split('?')[0];

    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.log(`[404] ${req.url} -> File Not Found`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            const extname = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[extname] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, async () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('request', request => {
        console.log(`>> Request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
        console.log(`<< Response: ${response.status()} ${response.url()}`);
    });

    page.on('console', msg => {
        console.log(`BROWSER CONSOLE: [${msg.type()}] ${msg.text()}`);
    });

    await page.goto(`http://localhost:${PORT}/index.html`);
    await page.waitForTimeout(1000);

    await browser.close();
    server.close();
    console.log('Done debugging.');
});
