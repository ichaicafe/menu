/**
 * Lazy-load Supabase: replaces the blocking <script defer src="lib/supabase.min.js">
 * with an on-demand loader. supabase-client.js calls window.__ensureSupabase()
 * before init; if the lib isn't loaded yet, we inject it dynamically.
 *
 * Used by: build-lazy.js (run at build time)
 */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

const LOADER = `
<script>
window.__ensureSupabase = function () {
  if (window.__supabaseLoading) return window.__supabaseLoading;
  if (window.supabase) return Promise.resolve();
  window.__supabaseLoading = new Promise(function (resolve) {
    var s = document.createElement("script");
    s.src = "lib/supabase.min.js";
    s.onload = resolve;
    s.onerror = resolve; // offline mode still works
    document.head.appendChild(s);
  });
  return window.__supabaseLoading;
};
</script>`;

for (const f of ["index.html", "admin.html"]) {
  let html = fs.readFileSync(path.join(ROOT, f), "utf8");
  html = html.replace(/<script defer src="lib\/supabase\.min\.js"><\/script>/, LOADER);
  fs.writeFileSync(path.join(ROOT, f), html);
  console.log(f, "supabase lazy-loader injected");
}
