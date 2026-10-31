// Composes the 1200x630 Open Graph / social card from the supplied artwork
// (hero crop + monogram) and HTML typography, rendered in headless Chrome.
//
//   CHROME_PATH=/usr/bin/google-chrome node scripts/build-og.mjs
import { chromium } from "playwright-core";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const hero = pathToFileURL(
  path.join(root, "public/images/lady-justice-hero.webp"),
).href;
const mark = pathToFileURL(
  path.join(root, "public/logo/liberty-scoping-monogram-mark.png"),
).href;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#080808;position:relative;overflow:hidden;font-family:Inter,sans-serif;color:#F6F0E6}
  .art{position:absolute;left:-120px;top:0;height:630px;width:945px}
  .art img{width:100%;height:100%;display:block}
  .fade{position:absolute;inset:0;background:
    linear-gradient(to right,rgba(8,8,8,0) 0,rgba(8,8,8,0) 48%,#080808 74%),
    linear-gradient(to bottom,rgba(8,8,8,0) 80%,#080808 100%)}
  .copy{position:absolute;left:720px;top:0;bottom:0;width:430px;display:flex;flex-direction:column;justify-content:center}
  .brand{display:flex;align-items:center;gap:18px}
  .brand img{width:76px;height:76px}
  .l1{font:600 38px/1 'Cormorant Garamond',serif;letter-spacing:.2em;text-transform:uppercase}
  .l2{font:600 17px/1 'Cormorant Garamond',serif;letter-spacing:.52em;text-transform:uppercase;color:#C49A60;margin-top:10px}
  .rule{height:1px;width:150px;background:linear-gradient(90deg,#C49A60,transparent);margin:34px 0}
  .tag{font:600 40px/1.1 'Cormorant Garamond',serif;color:#F6F0E6}
  .tag span{color:#E5BD7A}
  .sub{margin-top:30px;font:500 17px/1.5 Inter,sans-serif;color:#C4BDB3;letter-spacing:.02em}
  .frame{position:absolute;inset:18px;border:1px solid rgba(151,115,73,.55);pointer-events:none}
</style></head><body>
  <div class="art"><img src="${hero}"></div><div class="fade"></div>
  <div class="copy">
    <div class="brand"><img src="${mark}"><div><div class="l1">Liberty</div><div class="l2">Scoping</div></div></div>
    <div class="rule"></div>
    <div class="tag">Accuracy in <span>Every Word.</span><br>Integrity in <span>Every Record.</span></div>
    <div class="sub">Legal scoping &amp; transcript production<br>Serving clients nationwide</div>
  </div>
  <div class="frame"></div>
</body></html>`;

const dir = await mkdtemp(path.join(tmpdir(), "og-"));
const file = path.join(dir, "og.html");
await writeFile(file, html);

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: path.join(root, "public/images/og-liberty-scoping.jpg"),
  type: "jpeg",
  quality: 92,
});
await browser.close();
console.log("og image built");
