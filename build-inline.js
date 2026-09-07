/**
 * Inline critical CSS + add loading hints directly into index.html & admin.html.
 * - Inlines tw.min.css + main.min.css (+ admin.min.css for admin) into <style>
 * - Keeps external tw.css/main.css files on disk for reference but not loaded
 * - Adds fetchpriority="high" to hero logo (LCP element)
 */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

function minifyHtml(html) {
  // preserve inline scripts and x- attributes; only strip indentation/comments
  return html
    .replace(/<!--[\s\S]*?-->/g, (m) => m.includes("[if") ? m : "")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ---------- index.html ----------
let idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const tw = fs.readFileSync(path.join(ROOT, "css", "tw.min.css"), "utf8");
const main = fs.readFileSync(path.join(ROOT, "css", "main.min.css"), "utf8");
const fontcss = fs.readFileSync(path.join(ROOT, "fonts", "fonts-subset.css"), "utf8");

const critical =
  "<style>" + fontcss + "</style>\n" +
  "<style>" + tw + "</style>\n" +
  "<style>" + main + "</style>\n" +
  "<style>.hero-bg{background-image:url('img/hero-bg.webp');background-position:center;background-size:cover;background-repeat:no-repeat}</style>";

idx = idx.replace(
  /  <!-- Vazirmatn \(subset, weights actually used only\) -->[\s\S]*?<\/head>/,
  "  <!-- Critical CSS inlined (fonts + tailwind + main) -->\n" + critical + "\n</head>"
);

// hero logo is the LCP element
idx = idx.replace(
  '<img src="img/logo-hero-280.webp" alt="کافه آی‌چای" class="hero-logo" width="280" height="280" decoding="async">',
  '<img src="img/logo-hero-280.webp" alt="کافه آی‌چای" class="hero-logo" width="280" height="280" decoding="sync" fetchpriority="high">'
);

// drop the separate hero preload (now inline CSS already requests it early) — keep preload, it helps.

idx = minifyHtml(idx);
fs.writeFileSync(path.join(ROOT, "index.html"), idx);
console.log("index.html:", (fs.statSync(path.join(ROOT, "index.html")).size / 1024).toFixed(1), "KiB");

// ---------- admin.html ----------
let adm = fs.readFileSync(path.join(ROOT, "admin.html"), "utf8");
const admincss = fs.readFileSync(path.join(ROOT, "css", "admin.min.css"), "utf8");
const admCritical =
  "<style>" + fontcss + "</style>\n" +
  "<style>" + tw + "</style>\n" +
  "<style>" + admincss + "</style>";

adm = adm.replace(
  /  <!-- Vazirmatn \(subset\) -->[\s\S]*?<\/head>/,
  "  <!-- Critical CSS inlined -->\n" + admCritical + "\n</head>"
);
adm = minifyHtml(adm);
fs.writeFileSync(path.join(ROOT, "admin.html"), adm);
console.log("admin.html:", (fs.statSync(path.join(ROOT, "admin.html")).size / 1024).toFixed(1), "KiB");
