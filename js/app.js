/**
 * app.js — Public menu page logic (Alpine.js)
 * Manages: categories, products, search, filtering, favorites panel, feedback, UI state.
 * No cart, no ordering — purely a display menu.
 */

document.addEventListener("alpine:init", () => {
  Alpine.data("cafeMenu", () => ({
    // State
    categories: [],
    products: [],
    cafeInfo: {},
    activeCategory: "cat-1",
    searchQuery: "",
    favorites: [],
    isLoaded: false,
    showMobileMenu: false,
    darkMode: false,
    showFavPanel: false,
    _observer: null,

    // Feedback state
    feedbackForm: { name: "", message: "" },
    feedbackSending: false,
    feedbackSuccess: false,
    feedbackError: "",

    // Init
    init() {
      // Hero entrance: opt into the CSS animation on first paint.
      // Two rAFs ensure the browser committed the initial state first,
      // so the transition actually plays instead of jumping.
      const hero = document.getElementById("heroContent");
      if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        hero.classList.add("hero-in-start");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            hero.classList.add("hero-in-end");
          });
        });
      }
      // 1) Instant paint: show cached data NOW (no network wait for text/hero).
      this.categories = Utils.getStorage("cafe_categories", DEFAULT_CATEGORIES);
      this.products = Utils.getStorage("cafe_products", DEFAULT_PRODUCTS);
      this.cafeInfo = Utils.getStorage("cafe_info", DEFAULT_CAFE_INFO);
      this.loadFavorites();
      this.loadDarkMode();
      this.trackVisit();
      this.updateSeo();
      this.isLoaded = true;
      this.$nextTick(() => this.observeFadeIns());
      // 2) Revalidate in background (parallel fetches, then refresh UI).
      const refresh = () => {
        SupaDB.init();
        this.loadData().then(() => {
          this.$nextTick(() => this.observeFadeIns());
        });
      };
      // Supabase lib is lazy: ensure it is present before refresh (no-op offline)
      if (typeof window.__ensureSupabase === "function") {
        window.__ensureSupabase().then(refresh);
      } else {
        refresh();
      }
      this.setupNavbar();
    },

    // Load data from Supabase with localStorage fallback
    async loadData() {
      // Parallel fetches (was serial: 3x round-trip latency).
      const [cats, prods, info] = await Promise.all([
        SupaDB.fetchCategories(),
        SupaDB.fetchProducts(),
        SupaDB.fetchCafeInfo(),
      ]);
      this.categories = cats;
      this.products = prods;
      this.cafeInfo = info;
      this.categories.sort((a, b) => a.order - b.order);
      this.products.sort((a, b) => a.order - b.order);
      this.updateSeo();
    },

    // SEO: keep <title>, meta description, OG tags and JSON-LD in sync with
    // the admin-managed cafe info (crawlers that render JS pick this up).
    updateSeo() {
      const info = this.cafeInfo || {};
      const name = info.name || "کافه آی‌چای";
      const tagline = info.tagline || "تجربه‌ای ناب از طعم و آرامش";
      const desc = "منوی آنلاین " + name + ": " + tagline;
      document.title = name + " — منوی آنلاین قهوه، چای و دسر | تهران";

      const setMeta = (selector, attr, value) => {
        const el = document.querySelector(selector);
        if (el && value) el.setAttribute(attr, value);
      };
      setMeta('meta[name="description"]', "content", desc);
      setMeta('meta[property="og:title"]', "content", document.title);
      setMeta('meta[property="og:description"]', "content", desc);
      setMeta('meta[property="og:site_name"]', "content", name);
      setMeta('meta[name="twitter:title"]', "content", document.title);
      setMeta('meta[name="twitter:description"]', "content", desc);

      const faToEn = (s) =>
        String(s || "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
      const digits = faToEn(info.phone).replace(/\D/g, "");
      const phoneE164 = digits
        ? (digits.startsWith("0") ? "+98" + digits.slice(1) : "+" + digits)
        : null;

      const sameAs = [];
      if (info.instagram)
        sameAs.push("https://instagram.com/" + String(info.instagram).replace("@", ""));
      if (info.telegram)
        sameAs.push("https://t.me/" + String(info.telegram).replace("@", ""));

      const ld = document.getElementById("ldjson-cafe");
      if (ld) {
        try {
          const data = JSON.parse(ld.textContent);
          data.name = name;
          data.slogan = tagline;
          if (info.about_fa) data.description = info.about_fa;
          if (phoneE164) data.telephone = phoneE164;
          if (info.address_fa)
            data.address.streetAddress = info.address_fa;
          if (sameAs.length) data.sameAs = sameAs;
          if (info.logo_url) data.logo = info.logo_url;
          ld.textContent = JSON.stringify(data, null, 2);
        } catch (e) {
          console.warn("JSON-LD update failed:", e);
        }
      }
    },

    // Track site visits
    trackVisit() {
      const visits = Utils.getStorage("cafe_visit_count", 0) + 1;
      Utils.setStorage("cafe_visit_count", visits);
    },

    // Favorites
    loadFavorites() {
      this.favorites = Utils.getStorage("cafe_favorites", []);
    },

    toggleFavorite(productId) {
      const idx = this.favorites.indexOf(productId);
      if (idx > -1) {
        this.favorites.splice(idx, 1);
      } else {
        this.favorites.push(productId);
      }
      Utils.setStorage("cafe_favorites", this.favorites);
    },

    isFavorite(productId) {
      return this.favorites.includes(productId);
    },

    get favoriteProducts() {
      return this.products.filter((p) => this.favorites.includes(p.id));
    },

    get favoriteCount() {
      return this.favorites.length;
    },

    // Favorites panel
    toggleFavPanel() {
      this.showFavPanel = !this.showFavPanel;
    },

    // Dark mode
    loadDarkMode() {
      this.darkMode = Utils.getStorage("cafe_dark_mode", false);
      if (this.darkMode) {
        document.body.classList.add("dark-mode");
      }
    },

    toggleTheme() {
      this.darkMode = !this.darkMode;
      document.body.classList.toggle("dark-mode", this.darkMode);
      Utils.setStorage("cafe_dark_mode", this.darkMode);
    },

    // Filtering
    setCategory(catId) {
      this.activeCategory = catId;
      this.$nextTick(() => this.observeFadeIns());
    },

    get filteredProducts() {
      let list = this.products;
      if (this.activeCategory !== "cat-1") {
        list = list.filter((p) => p.category_id === this.activeCategory);
      }
      const raw = this.searchQuery;
      if (!raw || !raw.trim()) return list;
      const q = raw.trim().toLowerCase().replace(/\s+/g, " ");
      if (!q) return list;

      const scored = [];
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const name = (p.name_fa || "").toLowerCase();
        const desc = (p.description_fa || "").toLowerCase();
        let score = 0;
        if (name.startsWith(q)) score = 3;
        else if (this._wordMatch(name, q)) score = 2;
        else if (name.includes(q) || desc.includes(q)) score = 1;
        if (score > 0) scored.push({ p, score, order: p.order });
      }
      scored.sort((a, b) => b.score - a.score || a.order - b.order);
      return scored.map((s) => s.p);
    },

    get featuredProducts() {
      return this.products.filter((p) => p.is_featured);
    },

    // Admin-controlled mobile density: cafe_info.mobile_grid_cols === 2 → 2 columns on phones
    get mobileTwoCols() {
      return Number(this.cafeInfo && this.cafeInfo.mobile_grid_cols) === 2;
    },

    // Feedback
    async submitFeedback() {
      this.feedbackError = "";
      if (!this.feedbackForm.message.trim()) {
        this.feedbackError = "لطفاً پیام خود را بنویسید.";
        return;
      }
      this.feedbackSending = true;
      try {
        await SupaDB.submitFeedback({
          name: this.feedbackForm.name.trim() || "ناشناس",
          message: this.feedbackForm.message.trim(),
        });
        this.feedbackSuccess = true;
        this.feedbackForm = { name: "", message: "" };
        setTimeout(() => (this.feedbackSuccess = false), 4000);
      } catch (e) {
        console.warn("Feedback submit failed:", e);
        this.feedbackError = "خطا در ارسال. لطفاً دوباره تلاش کنید.";
      } finally {
        this.feedbackSending = false;
      }
    },

    // Helpers
    // Image optimization: map original Supabase URLs to local resized assets
    prodImg(p) {
      const u = p && p.image_url;
      return (typeof IMG_MAP !== "undefined" && u && IMG_MAP[u]) || u || "";
    },
    prodW(p) {
      const rel = this.prodImg(p);
      return (typeof IMG_DIMS !== "undefined" && IMG_DIMS[rel]) ? IMG_DIMS[rel][0] : 640;
    },
    prodH(p) {
      const rel = this.prodImg(p);
      return (typeof IMG_DIMS !== "undefined" && IMG_DIMS[rel]) ? IMG_DIMS[rel][1] : 640;
    },

    _wordMatch(haystack, needle) {
      if (!haystack || !needle) return false;
      const words = haystack.split(/[\s،.!?،\-\/]+/);
      for (let i = 0; i < words.length; i++) {
        if (words[i] === needle) return true;
      }
      return false;
    },

    formatPrice(toman) {
      return Utils.formatPrice(toman);
    },

    toPersianNum(n) {
      return Utils.toPersianNum(n);
    },

    // Scroll-triggered fade-in via IntersectionObserver
    observeFadeIns() {
      if (!this._observer) {
        this._observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                this._observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
      }
      // No getBoundingClientRect pre-check here: it forces a sync layout
      // per element on the main thread. IntersectionObserver fires
      // immediately for in-viewport elements, so just observe all.
      document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => {
        el.classList.add("js-anim");
        this._observer.observe(el);
      });
    },

    // Navbar scroll effect
    setupNavbar() {
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
    },

    // Smooth scroll to section
    scrollTo(id) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      this.showMobileMenu = false;
    },
  }));
});
