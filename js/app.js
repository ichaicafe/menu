/**
 * app.js — Public menu page logic (Alpine.js)
 * Manages: categories, products, search, filtering, favorites, UI state.
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
    showFavorites: false,

    // Init
    async init() {
      SupaDB.init();
      await this.loadData();
      this.loadFavorites();
      this.loadDarkMode();
      this.trackVisit();
      // Simulate brief load for skeleton effect
      setTimeout(() => {
        this.isLoaded = true;
        this.$nextTick(() => this.observeFadeIns());
      }, 600);
      // Navbar scroll effect
      this.setupNavbar();
    },

    // Load data from Supabase with localStorage fallback
    async loadData() {
      this.categories = await SupaDB.fetchCategories();
      this.products = await SupaDB.fetchProducts();
      this.cafeInfo = await SupaDB.fetchCafeInfo();
      // Sort by order
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

    // Favorites view
    setShowFavorites(val) {
      this.showFavorites = val;
      if (val) {
        this.activeCategory = "cat-1";
        this.searchQuery = "";
      }
    },

    get favoriteProducts() {
      return this.products.filter((p) => this.favorites.includes(p.id));
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

    // Filtering
    setCategory(catId) {
      this.activeCategory = catId;
    },

    get filteredProducts() {
      let list = this.showFavorites
        ? this.favoriteProducts
        : this.products;
      if (this.activeCategory !== "cat-1") {
        list = list.filter((p) => p.category_id === this.activeCategory);
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.trim();
        list = list.filter(
          (p) =>
            p.name_fa.includes(q) ||
            p.description_fa.includes(q)
        );
      }
      return list;
    },

    get featuredProducts() {
      return this.products.filter((p) => p.is_featured);
    },

    get favoriteCount() {
      return this.favorites.length;
    },

    // Helpers
    formatPrice(toman) {
      return Utils.formatPrice(toman);
    },

    toPersianNum(n) {
      return Utils.toPersianNum(n);
    },

    // Scroll-triggered fade-in via IntersectionObserver
    observeFadeIns() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );

      document.querySelectorAll(".fade-in").forEach((el) => {
        observer.observe(el);
      });
    },

    // Navbar scroll effect
    setupNavbar() {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return;
      window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      });
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
