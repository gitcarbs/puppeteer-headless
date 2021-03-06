const puppeteer = require('puppeteer');
const argv = require('minimist')(process.argv.slice(2));
const file = require('mz/fs');
const timeout = require('delay');

// CLI Args
const url = argv.url || 'https://www.google.com';
const format = argv.format === 'jpeg' ? 'jpeg' : 'png';
const viewportWidth = argv.viewportWidth || 1920;
const viewportHeight = argv.viewportHeight || 900;
const delay = argv.delay || 0;
const userAgent = argv.userAgent;
const fullPage = argv.full;
const outputDir = argv.outputDir || './';
const output = argv.output || `output.${format === 'png' ? 'png' : 'jpg'}`;

// Host and cookies must be supplied together
const cookies = argv.cookies;
const host = argv.host;

const pdf = argv.pdf;
const headers = argv.headers;

init();

async function init() {

    var browser;

    try {
        // Start the Chrome Debugging Protocol
        browser =  await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await
        browser.newPage();
        await page.setViewport({width: viewportWidth, height: viewportHeight});

        //node chrome.js --url= --output=b152988d320.pdf --pdf --full --host= --cookies="{\"token\":\"eyJraWQiO\"}"
        if (cookies && host) {
            // Add cookies from the received cookie JSON object
            const cookiesObj = JSON.parse(cookies);

            for (var key in cookiesObj) {
                await page.setCookie({
                    name: key,
                    value: cookiesObj[key],
                    url: host
                });
            }
        }

        //node chrome.js --url= --output=9b152988d320.png --full --headers="{\"Authorization\":\"Bearer eyJ0eXAiOiJKV1\"}"
        if (headers) {
            // Add basic auth info
            await page.setExtraHTTPHeaders(JSON.parse(headers));
        }

        // Navigate to target page
        await page.goto(url, {waitUntil: 'networkidle' });
        
        try {
            page.evaluate(_ => {
                window.scrollTo(0,document.body.scrollHeight);
            });
        } catch(err) {
                console.warn('Could not scroll to end of page');
        }


        const output_path = `${outputDir + output}`;

        if (pdf) {
             // Generates a PDF with 'screen' media type.
            await page.emulateMedia('screen');

            await page.pdf({
                path: output_path,
                landscape: true,
                printBackground: true
            });

            console.log('PDF Printed with Chrome');
        } else {
            const screenshot = await
            page.screenshot({
                path: output_path,
                type: format,
                fullPage: true
            });
            console.log('Screenshot saved');
        }
        await browser.close();
    } catch (err) {
        if (browser) {
            await browser.close();
        }
        console.error('Exception while taking screenshot:', err);
        process.exit(1);
    }
}
