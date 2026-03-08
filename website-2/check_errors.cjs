const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Launching browser...");
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        page.on('console', msg => {
            console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
        });

        page.on('pageerror', error => {
            console.log(`PAGE ERROR: ${error.message}`);
        });

        page.on('requestfailed', request => {
            console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
        });

        page.on('response', response => {
            if (response.status() >= 400) {
                console.log(`HTTP ${response.status()}: ${response.url()}`);
            }
        });

        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

        console.log("Page loaded. Waiting 5 seconds...");
        await new Promise(r => setTimeout(r, 5000));

        await browser.close();
    } catch (e) {
        console.error("Script error:", e.message);
    }
})();
