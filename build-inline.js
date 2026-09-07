/**
 * Rebuild inlined critical CSS in index.html + admin.html FROM CURRENT SOURCES.
 * - Replaces ALL existing <style>...</style> blocks in <head> with fresh builds:
 *   fonts-subset.css + tw.min.css + main.min.css (+ admin.min.css for admin).
 * - Rewrites hero-bg override to use fresh main.min.css hero rule (no separate block).
 * - Adds fetchpriority="high" + decoding="sync" to hero logo (LCP).
 * - Adds preload for Regular(400) + Black(900) subsets (hero weights).
 * - Keeps the single alpine script tag. Idempotent: run any number of times.
 */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, (m) => (m.includes("[if") ? m : ""))
    .replace(/\n\s+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function criticalCss(extra) {
  const fontcss = fs.readFileSync(path.join(ROOT, "fonts", "fonts-subset.css"), "utf8");
  const tw = fs.readFileSync(path.join(ROOT, "css", "tw.min.css"), "utf8");
  // main.min.css URLs are relative to css/; when inlined, rewrite to page-relative
  const main = fs
    .readFileSync(path.join(ROOT, "css", "main.min.css"), "utf8")
    .replace(/\.\.\/img\//g, "img/");
  let out = "<style>" + fontcss + "</style>\n<style>" + tw + "</style>\n<style>" + main + "</style>";
  if (extra === "admin") {
    const admincss = fs.readFileSync(path.join(ROOT, "css", "admin.min.css"), "utf8");
    out += "\n<style>" + admincss + "</style>";
  }
  return out;
}

const PRELOAD =
  '<link rel="preload" href="fonts/subset/Vazirmatn-Regular-sub.woff2" as="font" type="font/woff2" crossorigin>\n' +
  '<link rel="preload" href="fonts/subset/Vazirmatn-Black-sub.woff2" as="font" type="font/woff2" crossorigin>';

function rebuild(file, extra) {
  let html = fs.readFileSync(path.join(ROOT, file), "utf8");

  // 1) strip ALL head <style> blocks (stale inlined builds)
  html = html.replace(/<head>([\s\S]*?)<\/head>/, (m, head) => {
    let h = head.replace(/<style>[\s\S]*?<\/style>/g, "");
    // 2) strip old font preloads to avoid dupes
    h = h.replace(/<link rel="preload" href="fonts\/subset[^>]*>\n?/g, "");
    // 3) insert fresh critical CSS + preloads.
    // index.html: before the alpine script; admin.html: before </head> chunk end.
    const anchor = '<script defer src="lib/alpine.min.js"></script>';
    const insert = criticalCss(extra) + "\n" + PRELOAD + "\n";
    if (h.includes(anchor)) {
      h = h.replace(anchor, () => insert + anchor);
    } else {
      h = h.trimEnd() + "\n" + insert;
    }
    return "<head>" + h + "</head>";
  });

  // 4) hero logo = LCP: sync decode + high priority
  html = html.replace(
    /<img src="img\/logo-hero-280\.webp" alt="کافه آی‌چای" class="hero-logo" width="280" height="280" decoding="async">/,
    '<img src="img/logo-hero-280.webp" alt="کافه آی‌چای" class="hero-logo" width="280" height="280" decoding="sync" fetchpriority="high">'
  );

  html = minifyHtml(html);
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log(file + ":", (fs.statSync(path.join(ROOT, file)).size / 1024).toFixed(1), "KiB");
}

rebuild("index.html");
rebuild("admin.html", "admin");
