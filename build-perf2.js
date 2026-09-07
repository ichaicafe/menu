/**
 * Perf pass 2 — smoothness + faster text:
 *
 * 1) Kill the isLoaded искусственный 600ms delay (skeleton waits) -> instant reveal.
 * 2) .fade-in: show content immediately if JS/observer never runs (no-JS safety),
 *    shorter+snappier transition, honour prefers-reduced-motion.
 * 3) Navbar scroll listener -> passive + rAF throttled (smoother scrolling).
 * 4) Drop unused Light(300) font weight (~34 KB less), keep 400..900.
 * 5) Re-inline all CSS into both HTML files (build-inline + fontfix).
 *
 * NOTE: reads sources, writes built files. Run: node build-perf2.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = __dirname;

// ---------- 1) app.js: remove artificial 600ms delay ----------
let app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
app = app.replace(
  `          setTimeout(() => {
            this.isLoaded = true;
            this.$nextTick(() => this.observeFadeIns());
          }, 600);`,
  `          this.isLoaded = true;
          this.$nextTick(() => this.observeFadeIns());`
);
fs.writeFileSync(path.join(ROOT, "js", "app.js"), app);
console.log("app.js: 600ms skeleton delay removed");

// ---------- 2) main.css: smoother/safer fade-in ----------
let main = fs.readFileSync(path.join(ROOT, "css", "main.css"), "utf8");
main = main.replace(
  `.fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}`,
  `.fade-in {
  opacity: 1;
  transform: none;
}

/* Only animate when JS marks the element as ready */
.fade-in.js-anim {
  opacity: 0;
  transform: translateY(24px);
  will-change: opacity, transform;
}

.fade-in.js-anim.visible {
  opacity: 1;
  transform: translateY(0);
  will-change: auto;
}

@media (prefers-reduced-motion: reduce) {
  .fade-in.js-anim {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .scroll-indicator,
  .skeleton::after {
    animation: none;
  }
  * {
    scroll-behavior: auto !important;
  }
}`
);
main = main.replace(
  `.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}`,
  ``
);
fs.writeFileSync(path.join(ROOT, "css", "main.css"), main);
console.log("main.css: fade-in no-JS safe + reduced-motion added");

// ---------- 3) app.js: rAF-throttled passive navbar scroll ----------
app = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
app = app.replace(
  `    setupNavbar() {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;
      window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      });
    },`,
  `    setupNavbar() {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;
      let ticking = false;
      window.addEventListener(
        "scroll",
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            navbar.classList.toggle("scrolled", window.scrollY > 50);
            ticking = false;
          });
        },
        { passive: true }
      );
    },`
);
// observeFadeIns: add .js-anim marker class so CSS only hides when JS is alive
app = app.replace(
  `      document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => {
        this._observer.observe(el);
      });`,
  `      document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => {
        el.classList.add("js-anim");
        this._observer.observe(el);
      });`
);
fs.writeFileSync(path.join(ROOT, "js", "app.js"), app);
console.log("app.js: passive rAF navbar + js-anim marker");

// ---------- 4) fonts: drop Light 300 (unused by final CSS) ----------
const fontCssPath = path.join(ROOT, "fonts", "fonts-subset.css");
let fcss = fs.readFileSync(fontCssPath, "utf8");
fcss = fcss.replace(/@font-face\{[^}]*font-weight:300[^}]*\}/, "");
fs.writeFileSync(fontCssPath, fcss);
console.log("fonts-subset.css: weight 300 dropped");

// ---------- 5) rebuild: css minify + js minify + inline ----------
execSync("node build-css.js", { cwd: ROOT, stdio: "inherit" });
execSync(`python "$LOCALAPPDATA/Temp/minify_js.py"`, { cwd: ROOT, stdio: "inherit", shell: "bash" });
execSync("node build-inline.js", { cwd: ROOT, stdio: "inherit" });
execSync("node build-fontfix.js", { cwd: ROOT, stdio: "inherit" });
execSync("node build-lazy.js", { cwd: ROOT, stdio: "inherit" });
console.log("rebuild complete");
