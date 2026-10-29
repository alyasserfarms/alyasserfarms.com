import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Browser, sleep } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { probe, layout, app } from '../.agents/skills/design-taste-frontend/scripts/lib/probe.mjs';
import { judge, judgeLayout, judgeApp, APP_SKIP } from '../.agents/skills/design-taste-frontend/scripts/lib/rules.mjs';

const out = 'docs/review-phase-two';
const base = 'http://127.0.0.1:3001';
const key = 'alyasser.cart.v1';
mkdirSync(out, { recursive: true });
const browser = await Browser.launch();
const checks = [];
const visuals = [];
const check = (name, actual, expected = true) => { assert.deepEqual(actual, expected, name); checks.push({ name, passed: true }); };
const page = await browser.newPage({ width: 1440, height: 900 });
await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__shoppingMetrics={lcp:0,cls:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__shoppingMetrics.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__shoppingMetrics.cls+=e.value})).observe({type:'layout-shift',buffered:true});` });

async function waitFor(expression) {
  for (let i = 0; i < 80; i++) { if (await page.eval(expression)) return; await sleep(50); }
  throw new Error(`Timed out: ${expression}`);
}
async function click(selector) { await page.eval((s) => { const element = document.querySelector(s); if (!element) throw new Error(s); element.click(); }, selector); await sleep(100); }
async function fill(selector, value) {
  await page.eval(({ selector, value }) => {
    const element = document.querySelector(selector);
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, { selector, value });
  await sleep(80);
}

async function snapshot(route, name) {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewport({ width, height: width < 600 ? 844 : 900, mobile: width < 600 });
    await page.goto(`${base}${route}`, { settleMs: 450 });
    await page.eval('document.fonts.ready');
    check(`${name}: no overflow at ${width}px`, await page.eval(() => document.documentElement.scrollWidth <= innerWidth));
    check(`${name}: one main and h1 at ${width}px`, await page.eval(() => document.querySelectorAll('main').length === 1 && document.querySelectorAll('h1').length === 1));
    const imageName = `${name}-${width}`;
    const height = await page.eval(() => document.documentElement.scrollHeight);
    const performance = await page.eval(() => window.__shoppingMetrics);
    await page.eval(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await sleep(250);
    await page.eval(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `${out}/${imageName}-fold.jpg`, quality: 84 });
    if (width === 1440 || width === 390) await page.screenshot({ path: `${out}/${imageName}-full.jpg`, fullPage: true, quality: 82 });
    const metrics = await page.eval(probe);
    const frameLayout = await page.eval(layout);
    const rawFindings = [...judge(metrics, { width }), ...judgeLayout(frameLayout, { width })];
    // Cart and address entry are functional screens. Use the skill's app checks for them;
    // their job does not call for a four-photo marketing floor or cinematic entrances.
    const functional = name === 'cart' || name === 'delivery';
    const findings = functional ? [...rawFindings.filter((finding) => !APP_SKIP.has(finding.id) && !['no-title', 'small-title'].includes(finding.id)), ...judgeApp(await page.eval(app), metrics, { width })] : rawFindings;
    visuals.push({ name, width, height, performance, performanceConditions: "Local Chrome, unthrottled, no field INP measurement", profile: functional ? 'functional-app' : 'public-commerce-page', rawFindings, findings, image: `${imageName}-fold.jpg` });
  }
}

try {
  await page.goto(`${base}/shop`);
  check('Shop renders all six sample products', await page.eval(() => document.querySelectorAll('.catalogue-product').length), 6);
  await fill('#shop-search', 'منتج غير موجود');
  check('Search has a meaningful empty state', await page.eval(() => !!document.querySelector('.commerce-empty')));
  await click('.commerce-empty button');
  check('Reset restores all products', await page.eval(() => document.querySelectorAll('.catalogue-product').length), 6);
  await page.eval(() => { const select = document.getElementById('shop-sort'); select.value = 'price-low'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  await sleep(100);
  check('Ascending price sort is correct', await page.eval(() => [...document.querySelectorAll('.catalogue-product .price bdi')].map((node) => Number(node.textContent))), [9, 12, 24, 28, 45, 85]);
  await page.goto(`${base}/shop?category=fruit`);
  check('A shareable category URL filters products', await page.eval(() => document.querySelectorAll('.catalogue-product').length), 1);
  check('Category matches the right product', await page.eval(() => document.querySelector('.catalogue-product h2').textContent), 'برتقال المائدة');
  await click('.catalogue-photo');
  await waitFor("location.pathname === '/products/oranges' && !!document.querySelector('.product-page-copy')");
  check('Product route has a named heading', await page.eval(() => document.querySelector('main h1').textContent), 'برتقال المائدة');
  await click('.product-purchase .quantity-picker button:last-child');
  await click('.product-purchase > .button');
  check('Adding chosen quantity updates the shared bag', await page.eval(() => document.querySelector('.cart-count').textContent), '2');
  await click('.product-live-feedback a');
  await waitFor("location.pathname === '/cart' && !!document.querySelector('.cart-line')");
  check('The full cart shows the selected quantity', await page.eval(() => document.querySelector('.cart-line .quantity-picker output').textContent), '2');
  check('The full cart total is correct', await page.eval(() => document.querySelector('.summary-total strong').textContent), '24');
  await page.goto(`${base}/cart`);
  check('Cart survives a full page reload', await page.eval(() => document.querySelector('.cart-line .quantity-picker output').textContent), '2');
  await click('.cart-line .quantity-picker button:last-child');
  check('Changing quantity updates the total', await page.eval(() => document.querySelector('.summary-total strong').textContent), '36');
  await click('.remove-line');
  check('Removing the last item exposes the empty state', await page.eval(() => !!document.querySelector('.commerce-empty')));
  await click('.undo-removal > button:not(.icon-button)');
  check('Undo restores the item and quantity', await page.eval(() => document.querySelector('.cart-line .quantity-picker output').textContent), '3');
  const other = await browser.newPage({ width: 390, height: 844, mobile: true });
  await other.goto(`${base}/cart`);
  await page.eval(() => document.querySelector('.cart-line .quantity-picker button:last-child').click());
  await sleep(150);
  check('Cart synchronizes across browser tabs', await other.eval(() => document.querySelector('.cart-line .quantity-picker output').textContent), '4');
  await other.close();
  await click('.order-summary > a');
  await waitFor("location.pathname === '/delivery' && !!document.querySelector('.delivery-form')");
  await click('.delivery-form button[type="submit"]');
  check('Invalid delivery fields get four inline errors', await page.eval(() => document.querySelectorAll('.field-error').length), 4);
  check('Failed submit focuses the error summary', await page.eval(() => document.activeElement.classList.contains('form-error-summary')));
  await click('.form-error-summary a');
  check('Error links focus the related field', await page.eval(() => document.activeElement.id), 'delivery-name');
  await page.screenshot({ path: `${out}/delivery-errors-desktop.jpg` });
  await fill('#delivery-name', 'عميل تجريبي');
  await fill('#delivery-phone', '+١٢٣٤٥٦٧٨٩٠');
  await fill('#delivery-city', 'مدينة تجريبية');
  await fill('#delivery-address', 'شارع تجريبي، مبنى 12، شقة 3');
  await fill('#delivery-notes', 'ملاحظات تجربة الواجهة فقط');
  await click('.delivery-form button[type="submit"]');
  check('Valid local address opens the review', await page.eval(() => !!document.querySelector('.address-review')));
  check('Review explicitly confirms no real order was submitted', await page.eval(() => document.querySelector('.address-review').textContent.includes('لم يُنشأ طلب')));
  check('Delivery details are absent from local storage', await page.eval(() => !Object.values(localStorage).some((value) => value.includes('عميل تجريبي') || value.includes('شارع تجريبي'))));
  await page.screenshot({ path: `${out}/delivery-review-desktop.jpg` });
  await click('.review-actions button');
  check('Editing retains the entered address', await page.eval(() => document.getElementById('delivery-address').value), 'شارع تجريبي، مبنى 12، شقة 3');
  await page.eval((key) => localStorage.setItem(key, '{malformed'), key);
  await page.goto(`${base}/cart`);
  check('Corrupt stored cart safely becomes empty', await page.eval(() => !!document.querySelector('.commerce-empty')));
  await page.goto(`${base}/delivery`);
  check('Delivery cannot continue with an empty cart', await page.eval(() => !!document.querySelector('.commerce-empty') && !document.querySelector('.delivery-form')));
  await page.eval((key) => localStorage.setItem(key, JSON.stringify({ oranges: 99999, beef: -1, milk: 'bad', unknown: 5 })), key);
  await page.goto(`${base}/cart`);
  check('Saved quantities are clamped and invalid items are ignored', await page.eval(() => [document.querySelectorAll('.cart-line').length, document.querySelector('.quantity-picker output').textContent]), [1, '99']);
  check('Increment is disabled at the preview quantity limit', await page.eval(() => document.querySelector('.quantity-picker button:last-child').disabled));
  await page.goto(`${base}/products/not-a-real-product`);
  check('Unknown products have a usable not-found page', await page.eval(() => document.querySelector('main h1').textContent), 'لم نجد هذه الصفحة');
  const blocked = await browser.newPage({ width: 390, height: 844, mobile: true });
  await blocked.send('Page.addScriptToEvaluateOnNewDocument', { source: `for (const method of ['getItem','setItem']) Object.defineProperty(Storage.prototype,method,{value(){throw new DOMException('Storage blocked for test','SecurityError')}});` });
  await blocked.goto(`${base}/shop`);
  await blocked.eval(() => document.querySelector('.catalogue-product .add-button').click());
  await sleep(100);
  check('A blocked localStorage still allows adding to the session bag', await blocked.eval(() => document.querySelector('.cart-count').textContent), '1');
  await blocked.eval(() => document.querySelector('.cart-button').click());
  await blocked.eval(() => document.querySelector('dialog[open] a[href="/cart"]').click());
  await sleep(350);
  check('Session-only bag survives client navigation when storage is blocked', await blocked.eval(() => document.querySelectorAll('.cart-line').length), 1);
  check('Unavailable storage is explained to the user', await blocked.eval(() => document.querySelector('.cart-storage-note').textContent.includes('غير متاح')));
  check('No uncaught errors with blocked localStorage', blocked.consoleErrors, []);
  await blocked.close();
  await page.eval((key) => localStorage.setItem(key, JSON.stringify({ oranges: 2, 'vegetable-basket': 1 })), key);
  await snapshot('/shop', 'shop');
  await snapshot('/products/vegetable-basket', 'product');
  await snapshot('/cart', 'cart');
  await snapshot('/delivery', 'delivery');
  await page.goto(`${base}/delivery`);
  await page.setViewport({ width: 390, height: 844, mobile: true });
  await click('.delivery-form button[type="submit"]');
  await page.screenshot({ path: `${out}/delivery-errors-mobile.jpg`, fullPage: true });
  check('Mobile errors do not cause horizontal overflow', await page.eval(() => document.documentElement.scrollWidth <= innerWidth));
  check('No uncaught browser errors', page.consoleErrors, []);
  writeFileSync(`${out}/results.json`, JSON.stringify({ timestamp: new Date().toISOString(), checks, visuals, errors: page.consoleErrors }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, screenshots: out, findings: visuals.map(({ name, width, findings }) => ({ name, width, fails: findings.filter(f => f.level === 'FAIL').map(f => ({ id: f.id, message: f.message })), warnings: findings.filter(f => f.level === 'WARN').map(f => f.id) })) }, null, 2));
} finally { await browser.close(); }
