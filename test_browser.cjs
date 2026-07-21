const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('error', err => console.log('ERROR:', err.message));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', (event) => {
      console.log('WINDOW ERROR:', event.message, event.filename, event.lineno, event.colno, event.error ? event.error.stack : '');
    });
    window.addEventListener('unhandledrejection', (event) => {
      console.log('UNHANDLED REJECTION:', event.reason);
    });
  });

  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_root.png' });
  
  await page.goto('http://localhost:3000/waiter/dashboard');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'screenshot_waiter.png' });

  await browser.close();
})();
