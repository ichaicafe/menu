/**
 * Fix font URLs when inlining fonts-subset.css into index.html/admin.html:
 * 'subset/...' paths are relative to fonts/ — must become 'fonts/subset/...'.
 * Run AFTER build-inline.js. Idempotent.
 */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

for (const f of ["index.html", "admin.html"]) {
  const p = path.join(ROOT, f);
  let html = fs.readFileSync(p, "utf8");
  const before = html;
  html = html.replace(/url\('subset\//g, "url('fonts/subset/");
  if (html !== before) {
    fs.writeFileSync(p, html);
    console.log(f, "font paths fixed");
  } else {
    console.log(f, "no change needed");
  }
}
