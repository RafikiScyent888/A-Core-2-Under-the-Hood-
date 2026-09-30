/* A tiny static server for the checks. ES modules need a real origin, so
   the page is never opened from disk. */
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
/* `rewrites` plants a defect in what is SERVED, never in the files on
   disk: { "assets/runner.js": [["from", "to"]] }. A rewrite whose text is
   not found throws, so a plant cannot go stale silently. */
export function serve(dir, rewrites) {
  rewrites = rewrites || {};
  const srv = http.createServer((q, r) => {
    const rel = decodeURIComponent(q.url.split('?')[0].split('#')[0]).replace(/^\/$/, '/index.html').replace(/^\//, '');
    const f = path.join(dir, rel);
    fs.readFile(f, (e, b) => {
      if (!e && rewrites[rel]) {
        let t = b.toString();
        rewrites[rel].forEach(([a, c]) => { if (t.indexOf(a) < 0) { console.log('PLANT TEXT NOT FOUND in ' + rel + ': ' + a); process.exit(2); } t = t.split(a).join(c); });
        b = Buffer.from(t);
      }
      r.writeHead(e ? 404 : 200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(e ? '' : b);
    });
  }).listen(0);
  return { url: `http://127.0.0.1:${srv.address().port}`, close: () => srv.close() };
}
export async function browser(extraArgs) {
  const pwPath = process.env.PW || '/opt/node22/lib/node_modules/playwright/index.mjs';
  const pw = await import(pwPath); const { chromium } = pw.default || pw;
  return chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'].concat(extraArgs || []) });
}
