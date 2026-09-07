/**
 * Build a purged Tailwind CSS file from index.html + admin.html.
 * Extracts all literal class names, runs Tailwind CLI standalone with the
 * repo's config, and writes css/tw.min.css. Also minifies main.css/admin.css.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const TW = "C:/Users/Woof/tailwindcss-standalone.exe"; // downloaded if missing

function extractClasses(file) {
  const src = fs.readFileSync(file, "utf8");
  const set = new Set();
  // class="..." attributes
  for (const m of src.matchAll(/class="([^"]*)"/g)) {
    m[1].split(/\s+/).forEach((c) => c && set.add(c));
  }
  // dynamic :class object keys
  for (const m of src.matchAll(/:class="\{([^}]*)\}"/g)) {
    for (const k of m[1].matchAll(/'([^']+)'/g)) set.add(k[1]);
  }
  return set;
}

(async () => {
  const classes = new Set();
  for (const f of ["index.html", "admin.html"]) {
    extractClasses(path.join(ROOT, f)).forEach((c) => classes.add(c));
  }
  // classes added via JS (dark-mode toggling etc.)
  ["dark-mode", "scrolled", "visible", "pop", "active"].forEach((c) => classes.add(c));

  // tailwind config lives in tw.config.js (JS, as standalone CLI expects)

  if (!fs.existsSync(TW)) {
    console.log("downloading tailwind standalone...");
    const os = require("os");
    const ver = "v3.4.17";
    const url = `https://github.com/tailwindlabs/tailwindcss/releases/download/${ver}/tailwindcss-windows-x64.exe`;
    const buf = Buffer.from(
      await (await fetch(url)).arrayBuffer()
    );
    fs.mkdirSync(path.dirname(TW), { recursive: true });
    fs.writeFileSync(TW, buf);
  }

  execSync(`"${TW}" -c tw.config.js -o css/tw.css`, {
    cwd: ROOT,
    stdio: "inherit",
  });

  // minify tw.css crudely (cssnano not available): strip comments + whitespace
  let css = fs.readFileSync(path.join(ROOT, "css", "tw.css"), "utf8");
  css = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").trim();
  fs.writeFileSync(path.join(ROOT, "css", "tw.min.css"), css);

  // minify main.css + admin.css the same way
  for (const name of ["main.css", "admin.css"]) {
    let c = fs.readFileSync(path.join(ROOT, "css", name), "utf8");
    // keep @font-face / @keyframes / media structure intact by only collapsing ws
    c = c.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};:,>])\s*/g, "$1").trim();
    fs.writeFileSync(path.join(ROOT, "css", name.replace(".css", ".min.css")), c);
  }

  console.log("tw.min.css:", (fs.statSync(path.join(ROOT, "css", "tw.min.css")).size / 1024).toFixed(1), "KiB");
  console.log("main.min.css:", (fs.statSync(path.join(ROOT, "css", "main.min.css")).size / 1024).toFixed(1), "KiB");
})();
