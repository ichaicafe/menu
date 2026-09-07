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
      // 1) Instant paint: show cached data NOW (no network wait for text/hero).
      this.categories = Utils.getStorage("cafe_categories", DEFAULT_CATEGORIES);
      this.products = Utils.getStorage("cafe_products", DEFAULT_PRODUCTS);
      this.cafeInfo = Utils.getStorage("cafe_info", DEFAULT_CAFE_INFO);
      this.loadFavorites();
      this.loadDarkMode();
      this.trackVisit();
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
      document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => {
        // Mark as JS-animated (CSS base state stays visible for no-JS),
        // then reveal immediately if already in viewport.
        el.classList.add("js-anim");
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add("visible");
        } else {
          this._observer.observe(el);
        }
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
