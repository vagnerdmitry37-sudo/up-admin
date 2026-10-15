import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const usage = `Usage: node ui-check.mjs --url <url> [--sizes 375x667,1280x800] [--click <selector>]...
  [--measure "<sel1>,<sel2>"] [--out <file.png>] [--logged-out] [--ready <selector>]`;

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const flag = (name) => args.includes(`--${name}`);

const url = option('url');
if (!url) {
  console.error(usage);
  process.exit(2);
}
const sizes = option('sizes', option('size', '375x667'))
  .split(',')
  .map((size) => size.trim().split('x').map(Number));
const clickSelectors = args.flatMap((arg, index) => (arg === '--click' ? [args[index + 1]] : []));
const measureSelectors = option('measure', '');
const out = option('out');
const readySelector = option('ready', 'app-root > :not(router-outlet)');
const loggedOut = flag('logged-out');

const chromePath = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((path) => path && existsSync(path));
if (!chromePath) {
  console.error('No Chrome or Edge found. Set CHROME_PATH.');
  process.exit(2);
}

const port = 9300 + Math.floor(Math.random() * 600);
const profile = mkdtempSync(join(tmpdir(), 'ui-check-'));
const browser = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--ignore-certificate-errors',
  '--no-proxy-server',
  '--no-first-run',
  '--disable-extensions',
  `--user-data-dir=${profile}`,
  'about:blank',
]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const finish = (code) => {
  browser.kill();
  setTimeout(() => {
    rmSync(profile, { recursive: true, force: true });
    process.exit(code);
  }, 300);
};

let targets;
for (let attempt = 0; attempt < 100 && !targets; attempt++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  } catch {
    await sleep(100);
  }
}
if (!targets) {
  console.error('Browser did not start.');
  finish(1);
}

const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve));

let nextId = 0;
const pending = new Map();
let consoleErrors = [];
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result
    ?.result?.value;
const waitFor = async (expression, timeout = 15000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) {
      return true;
    }
    await sleep(100);
  }
  return false;
};

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
  if (message.method === 'Fetch.requestPaused') {
    const body = JSON.stringify({ accessToken: 'ui-check', expiresAt: '2099-01-01T00:00:00Z' });
    send('Fetch.fulfillRequest', {
      requestId: message.params.requestId,
      responseCode: loggedOut ? 401 : 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: Buffer.from(loggedOut ? '{}' : body).toString('base64'),
    });
  }
  if (message.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(message.params.exceptionDetails.exception?.description ?? 'exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
  }
});

const pageState = `JSON.stringify({
  url: location.pathname,
  title: document.title,
  scrollY: Math.round(scrollY),
  documentHeight: document.documentElement.scrollHeight,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  activeElement: document.activeElement?.tagName.toLowerCase(),
  elements: ${JSON.stringify(measureSelectors)}.split(',').filter(Boolean).flatMap((selector) =>
    [...document.querySelectorAll(selector.trim())].map((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector: selector.trim(),
        text: element.textContent.trim().slice(0, 40),
        x: Math.round(box.x), y: Math.round(box.y),
        width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10,
        borderRadius: style.borderRadius,
        opacity: Number(style.opacity),
        visible: box.width > 0 && box.height > 0 && style.visibility !== 'hidden',
      };
    })),
})`;

await send('Runtime.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/auth/*' }] });

const results = [];
for (const [width, height] of sizes) {
  consoleErrors = [];
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 1024,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: width < 1024 });
  await send('Page.navigate', { url });
  const ready = await waitFor(`!!document.querySelector(${JSON.stringify(readySelector)})`);
  await sleep(300);

  const result = {
    size: `${width}x${height}`,
    ready,
    before: JSON.parse(await evaluate(pageState)),
  };
  result.clicks = [];
  for (const clickSelector of clickSelectors) {
    const clicked = await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(clickSelector)}); if (!el) return false; el.click(); return true; })()`,
    );
    await sleep(400);
    result.clicks.push({
      selector: clickSelector,
      ...(clicked ? {} : { error: `No element matches ${clickSelector}` }),
      state: JSON.parse(await evaluate(pageState)),
    });
  }
  result.after = result.clicks.at(-1)?.state;
  result.consoleErrors = consoleErrors;

  if (out) {
    const file = sizes.length > 1 ? out.replace(/(\.png)?$/, `-${width}x${height}.png`) : out;
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    result.screenshot = file;
  }
  results.push(result);
}

console.log(JSON.stringify(results, null, 2));
socket.close();
finish(0);
