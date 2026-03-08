const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        page.on('console', msg => {
            console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
        });

        page.on('pageerror', error => {
            console.log(`BROWSER PAGE ERROR: ${error.message}`);
        });

        page.on('requestfailed', request => {
            console.log(`BROWSER REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
        });

        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

        console.log("Page loaded. Waiting 5 seconds to catch delayed errors...");
        await new Promise(r => setTimeout(r, 5000));

        await browser.close();
    } catch (e) {
        console.error("Puppeteer script error:", e);
    }
})();
