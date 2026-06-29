/**
 * admin.js — Admin panel logic (Alpine.js)
 * Full CRUD for products, categories, and cafe info via Supabase.
 * Includes: auth, dashboard stats, searchable tables, modals, image upload, toast notifications.
 */

document.addEventListener("alpine:init", () => {
  Alpine.data("adminPanel", () => ({
    // Layout state
    activePage: "dashboard",
    sidebarOpen: false,
    darkMode: true,

    // Auth state
    isAuthenticated: false,
    loginEmail: "",
    loginPassword: "",
    loginLoading: false,
    loginError: "",

    // Data
    categories: [],
    products: [],
    cafeInfo: {},
    orders: [],

    // UI state
    searchQuery: "",
    showProductModal: false,
    showCategoryModal: false,
    showDeleteModal: false,
    editingProduct: null,
    editingCategory: null,
    deleteTarget: null,
    deleteType: "",
    toastMessage: "",
    toastType: "success",
    showToast: false,
    toastTimer: null,

    // Image upload state
    imageMode: "url",
    uploading: false,

    // Product form
    productForm: {
      name_fa: "",
      description_fa: "",
      price: "",
      category_id: "",
      image_url: "",
      is_featured: false,
    },

    // Category form
    categoryForm: {
      name_fa: "",
      icon: "",
    },

    // Content form
    contentForm: {},

    // Init
    async init() {
      this.loadTheme();
      this.generateMockOrders();

      if (SupaDB.init()) {
        const session = await SupaDB.getSession();
        if (session) {
          this.isAuthenticated = true;
          await this.loadData();
          return;
        }
      }

      // If Supabase not configured, load from localStorage as demo
      if (!SupaDB.ready) {
        this.categories = Utils.getStorage("cafe_categories", DEFAULT_CATEGORIES);
        this.products = Utils.getStorage("cafe_products", DEFAULT_PRODUCTS);
        this.cafeInfo = Utils.getStorage("cafe_info", DEFAULT_CAFE_INFO);
        this.contentForm = { ...this.cafeInfo };
        this.categories.sort((a, b) => a.order - b.order);
        this.products.sort((a, b) => a.order - b.order);
        this.isAuthenticated = true;
      }
    },

    // Auth methods
    async login() {
      this.loginError = "";
      this.loginLoading = true;
      try {
        const { error } = await SupaDB.signIn(
          this.loginEmail,
          this.loginPassword
        );
        if (error) throw error;
        this.isAuthenticated = true;
        await this.loadData();
        this.toast("با موفقیت وارد شدید");
      } catch {
        this.loginError = "ایمیل یا رمز عبور اشتباه است";
      }
      this.loginLoading = false;
    },

    async logout() {
      await SupaDB.signOut();
      this.isAuthenticated = false;
      this.categories = [];
      this.products = [];
      this.cafeInfo = {};
    },

    // Data management
    async loadData() {
      this.categories = await SupaDB.fetchCategories();
      this.products = await SupaDB.fetchProducts();
      this.cafeInfo = await SupaDB.fetchCafeInfo();
      this.contentForm = { ...this.cafeInfo };
      this.categories.sort((a, b) => a.order - b.order);
      this.products.sort((a, b) => a.order - b.order);
    },

    // Theme
    loadTheme() {
      this.darkMode = Utils.getStorage("admin_dark_mode", true);
    },

    toggleTheme() {
      this.darkMode = !this.darkMode;
      Utils.setStorage("admin_dark_mode", this.darkMode);
    },

    // Toast
    toast(message, type = "success") {
      clearTimeout(this.toastTimer);
      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;
      this.toastTimer = setTimeout(() => {
        this.showToast = false;
      }, 3000);
    },

    // Dashboard stats
    get totalProducts() {
      return this.products.length;
    },
    get totalCategories() {
      return this.categories.filter((c) => c.id !== "cat-1").length;
    },
    get featuredCount() {
      return this.products.filter((p) => p.is_featured).length;
    },
    get averagePrice() {
      if (!this.products.length) return 0;
      const sum = this.products.reduce((acc, p) => acc + Number(p.price), 0);
      return Math.round(sum / this.products.length);
    },

    // Search
    get filteredProducts() {
      if (!this.searchQuery.trim()) return this.products;
      const q = this.searchQuery.trim();
      return this.products.filter(
        (p) =>
          p.name_fa.includes(q) ||
          p.description_fa.includes(q) ||
          this.getCategoryName(p.category_id).includes(q)
      );
    },

    getCategoryName(catId) {
      const cat = this.categories.find((c) => c.id === catId);
      return cat ? cat.name_fa : "—";
    },

    // Product CRUD
    openAddProduct() {
      this.editingProduct = null;
      this.imageMode = "url";
      this.productForm = {
        name_fa: "",
        description_fa: "",
        price: "",
        category_id: this.categories.length > 1 ? this.categories[1].id : "",
        image_url: "",
        is_featured: false,
      };
      this.showProductModal = true;
    },

    openEditProduct(product) {
      this.editingProduct = product;
      this.imageMode = "url";
      this.productForm = {
        name_fa: product.name_fa,
        description_fa: product.description_fa,
        price: product.price,
        category_id: product.category_id,
        image_url: product.image_url,
        is_featured: product.is_featured,
      };
      this.showProductModal = true;
    },

    async saveProduct() {
      if (!this.productForm.name_fa.trim() || !this.productForm.price) {
        this.toast("لطفاً نام و قیمت محصول را وارد کنید", "error");
        return;
      }

      try {
        if (this.editingProduct) {
          const updated = {
            ...this.editingProduct,
            name_fa: this.productForm.name_fa,
            description_fa: this.productForm.description_fa,
            price: Number(this.productForm.price),
            category_id: this.productForm.category_id,
            image_url: this.productForm.image_url,
            is_featured: this.productForm.is_featured,
          };
          await SupaDB.saveProduct(updated);
          const idx = this.products.findIndex(
            (p) => p.id === this.editingProduct.id
          );
          if (idx > -1) this.products[idx] = updated;
          this.toast("محصول با موفقیت ویرایش شد");
        } else {
          const newProduct = {
            id: Utils.generateId(),
            name_fa: this.productForm.name_fa,
            description_fa: this.productForm.description_fa,
            price: Number(this.productForm.price),
            category_id: this.productForm.category_id,
            image_url: this.productForm.image_url,
            is_featured: this.productForm.is_featured,
            order: this.products.length + 1,
          };
          const saved = await SupaDB.saveProduct(newProduct);
          this.products.push(saved || newProduct);
          this.toast("محصول جدید اضافه شد");
        }
        this.showProductModal = false;
      } catch (e) {
        console.error("Save product failed:", e);
        this.toast("ذخیره محصول ناموفق بود. دوباره تلاش کنید", "error");
      }
    },

    confirmDeleteProduct(product) {
      this.deleteTarget = product;
      this.deleteType = "product";
      this.showDeleteModal = true;
    },

    // Category CRUD
    openAddCategory() {
      this.editingCategory = null;
      this.categoryForm = { name_fa: "", icon: "" };
      this.showCategoryModal = true;
    },

    openEditCategory(category) {
      this.editingCategory = category;
      this.categoryForm = { name_fa: category.name_fa, icon: category.icon };
      this.showCategoryModal = true;
    },

    async saveCategory() {
      if (!this.categoryForm.name_fa.trim()) {
        this.toast("لطفاً نام دسته‌بندی را وارد کنید", "error");
        return;
      }

      try {
        if (this.editingCategory) {
          const updated = {
            ...this.editingCategory,
            name_fa: this.categoryForm.name_fa,
            icon: this.categoryForm.icon,
          };
          await SupaDB.saveCategory(updated);
          const idx = this.categories.findIndex(
            (c) => c.id === this.editingCategory.id
          );
          if (idx > -1) this.categories[idx] = updated;
          this.toast("دسته‌بندی ویرایش شد");
        } else {
          const newCat = {
            id: Utils.generateId(),
            name_fa: this.categoryForm.name_fa,
            icon: this.categoryForm.icon,
            order: this.categories.length,
          };
          const saved = await SupaDB.saveCategory(newCat);
          this.categories.push(saved || newCat);
          this.toast("دسته‌بندی جدید اضافه شد");
        }
        this.showCategoryModal = false;
      } catch (e) {
        console.error("Save category failed:", e);
        this.toast("ذخیره دسته‌بندی ناموفق بود", "error");
      }
    },

    confirmDeleteCategory(category) {
      if (category.id === "cat-1") {
        this.toast("دسته‌بندی «همه» قابل حذف نیست", "error");
        return;
      }
      this.deleteTarget = category;
      this.deleteType = "category";
      this.showDeleteModal = true;
    },

    // Execute delete
    async executeDelete() {
      try {
        if (this.deleteType === "product") {
          await SupaDB.deleteProduct(this.deleteTarget.id);
          this.products = this.products.filter(
            (p) => p.id !== this.deleteTarget.id
          );
          this.toast("محصول حذف شد");
        } else if (this.deleteType === "category") {
          // Move products in this category to uncategorized
          for (const p of this.products) {
            if (p.category_id === this.deleteTarget.id) {
              p.category_id = "cat-1";
              await SupaDB.saveProduct(p);
            }
          }
          await SupaDB.deleteCategory(this.deleteTarget.id);
          this.categories = this.categories.filter(
            (c) => c.id !== this.deleteTarget.id
          );
          this.toast("دسته‌بندی حذف شد");
        }
      } catch (e) {
        console.error("Delete failed:", e);
        this.toast("حذف ناموفق بود. دوباره تلاش کنید", "error");
      }
      this.showDeleteModal = false;
      this.deleteTarget = null;
    },

    // Content management
    async saveContent() {
      try {
        this.cafeInfo = { ...this.contentForm };
        await SupaDB.saveCafeInfo(this.cafeInfo);
        this.toast("اطلاعات کافه ذخیره شد");
      } catch (e) {
        console.error("Save cafe info failed:", e);
        this.toast("ذخیره اطلاعات ناموفق بود", "error");
      }
    },

    // Image upload
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        this.toast("حجم فایل نباید بیشتر از ۵ مگابایت باشد", "error");
        return;
      }
      this.uploading = true;
      try {
        const url = await SupaDB.uploadImage(file);
        this.productForm.image_url = url;
        this.toast("تصویر آپلود شد");
      } catch {
        this.toast("آپلود تصویر ناموفق بود", "error");
      }
      this.uploading = false;
    },

    // Drag & drop reordering
    dragStartIndex: null,

    dragStart(index) {
      this.dragStartIndex = index;
    },

    dragOver(event) {
      event.preventDefault();
    },

    async drop(index) {
      if (this.dragStartIndex === null || this.dragStartIndex === index) return;
      const items =
        this.activePage === "products" ? this.products : this.categories;
      const [moved] = items.splice(this.dragStartIndex, 1);
      items.splice(index, 0, moved);
      items.forEach((item, i) => (item.order = i));
      try {
        for (const item of items) {
          if (this.activePage === "products") {
            await SupaDB.saveProduct(item);
          } else {
            await SupaDB.saveCategory(item);
          }
        }
        this.toast("ترتیب به‌روزرسانی شد");
      } catch {
        this.toast("به‌روزرسانی ترتیب ناموفق بود", "error");
      }
      this.dragStartIndex = null;
    },

    // Reset to defaults
    async resetToDefaults() {
      this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      this.cafeInfo = JSON.parse(JSON.stringify(DEFAULT_CAFE_INFO));
      this.contentForm = { ...this.cafeInfo };
      try {
        for (const cat of this.categories) {
          await SupaDB.saveCategory(cat);
        }
        for (const prod of this.products) {
          await SupaDB.saveProduct(prod);
        }
        await SupaDB.saveCafeInfo({ id: "singleton", ...this.cafeInfo });
        this.toast("داده‌ها به حالت اولیه بازگشت");
      } catch {
        this.toast("بازنشانی ناموفق بود", "error");
      }
    },

    // Export data as JSON
    exportData() {
      const data = {
        categories: this.categories,
        products: this.products,
        cafeInfo: this.cafeInfo,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aichai-data.json";
      a.click();
      URL.revokeObjectURL(url);
      this.toast("داده‌ها خروجی گرفته شد");
    },

    // Import data from JSON
    async importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.categories) {
            for (const cat of data.categories) {
              await SupaDB.saveCategory(cat);
            }
            this.categories = data.categories;
          }
          if (data.products) {
            for (const prod of data.products) {
              await SupaDB.saveProduct(prod);
            }
            this.products = data.products;
          }
          if (data.cafeInfo) {
            await SupaDB.saveCafeInfo(data.cafeInfo);
            this.cafeInfo = data.cafeInfo;
            this.contentForm = { ...this.cafeInfo };
          }
          this.toast("داده‌ها با موفقیت وارد شد");
        } catch {
          this.toast("فایل نامعتبر است", "error");
        }
      };
      reader.readAsText(file);
    },

    // Mock orders
    generateMockOrders() {
      this.orders = [
        {
          id: "ORD-1001",
          customer: "علی محمدی",
          items: 3,
          total: 365000,
          status: "delivered",
          date: "۱۴۰۴/۰۳/۱۵",
        },
        {
          id: "ORD-1002",
          customer: "سارا احمدی",
          items: 2,
          total: 240000,
          status: "preparing",
          date: "۱۴۰۴/۰۳/۱۵",
        },
        {
          id: "ORD-1003",
          customer: "رضا کریمی",
          items: 5,
          total: 590000,
          status: "delivered",
          date: "۱۴۰۴/۰۳/۱۴",
        },
        {
          id: "ORD-1004",
          customer: "مریم حسینی",
          items: 1,
          total: 125000,
          status: "pending",
          date: "۱۴۰۴/۰۳/۱۴",
        },
        {
          id: "ORD-1005",
          customer: "محمد رضایی",
          items: 4,
          total: 480000,
          status: "delivered",
          date: "۱۴۰۴/۰۳/۱۳",
        },
        {
          id: "ORD-1006",
          customer: "زهرا نوری",
          items: 2,
          total: 230000,
          status: "cancelled",
          date: "۱۴۰۴/۰۳/۱۳",
        },
      ];
    },

    statusBadgeClass(status) {
      const map = {
        delivered: "badge-green",
        preparing: "badge-blue",
        pending: "badge-gold",
        cancelled: "badge-red",
      };
      return map[status] || "badge-gold";
    },

    statusLabel(status) {
      const map = {
        delivered: "تحویل شده",
        preparing: "در حال آماده‌سازی",
        pending: "در انتظار",
        cancelled: "لغو شده",
      };
      return map[status] || status;
    },

    formatPrice(toman) {
      return Utils.formatPrice(toman);
    },

    toPersianNum(n) {
      return Utils.toPersianNum(n);
    },
  }));
});
