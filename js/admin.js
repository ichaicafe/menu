/**
 * admin.js — Admin panel logic (Alpine.js)
 * Full CRUD for products, categories, and cafe info using localStorage.
 * Includes: dashboard stats, searchable tables, modals, drag-drop, toast notifications.
 */

document.addEventListener("alpine:init", () => {
  Alpine.data("adminPanel", () => ({
    // Layout state
    activePage: "dashboard",
    sidebarOpen: false,
    darkMode: true,

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
    init() {
      this.loadData();
      this.loadTheme();
      this.generateMockOrders();
    },

    // Data management
    loadData() {
      this.categories = Utils.getStorage("cafe_categories", DEFAULT_CATEGORIES);
      this.products = Utils.getStorage("cafe_products", DEFAULT_PRODUCTS);
      this.cafeInfo = Utils.getStorage("cafe_info", DEFAULT_CAFE_INFO);
      this.contentForm = { ...this.cafeInfo };
      this.categories.sort((a, b) => a.order - b.order);
      this.products.sort((a, b) => a.order - b.order);
    },

    saveCategories() {
      Utils.setStorage("cafe_categories", this.categories);
    },

    saveProducts() {
      Utils.setStorage("cafe_products", this.products);
    },

    saveCafeInfo() {
      Utils.setStorage("cafe_info", this.cafeInfo);
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

    saveProduct() {
      if (!this.productForm.name_fa.trim() || !this.productForm.price) {
        this.toast("لطفاً نام و قیمت محصول را وارد کنید", "error");
        return;
      }

      if (this.editingProduct) {
        // Update
        const idx = this.products.findIndex((p) => p.id === this.editingProduct.id);
        if (idx > -1) {
          this.products[idx] = {
            ...this.products[idx],
            name_fa: this.productForm.name_fa,
            description_fa: this.productForm.description_fa,
            price: Number(this.productForm.price),
            category_id: this.productForm.category_id,
            image_url: this.productForm.image_url,
            is_featured: this.productForm.is_featured,
          };
        }
        this.toast("محصول با موفقیت ویرایش شد");
      } else {
        // Add
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
        this.products.push(newProduct);
        this.toast("محصول جدید اضافه شد");
      }

      this.saveProducts();
      this.showProductModal = false;
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

    saveCategory() {
      if (!this.categoryForm.name_fa.trim()) {
        this.toast("لطفاً نام دسته‌بندی را وارد کنید", "error");
        return;
      }

      if (this.editingCategory) {
        const idx = this.categories.findIndex((c) => c.id === this.editingCategory.id);
        if (idx > -1) {
          this.categories[idx] = {
            ...this.categories[idx],
            name_fa: this.categoryForm.name_fa,
            icon: this.categoryForm.icon,
          };
        }
        this.toast("دسته‌بندی ویرایش شد");
      } else {
        const newCat = {
          id: Utils.generateId(),
          name_fa: this.categoryForm.name_fa,
          icon: this.categoryForm.icon,
          order: this.categories.length,
        };
        this.categories.push(newCat);
        this.toast("دسته‌بندی جدید اضافه شد");
      }

      this.saveCategories();
      this.showCategoryModal = false;
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
    executeDelete() {
      if (this.deleteType === "product") {
        this.products = this.products.filter((p) => p.id !== this.deleteTarget.id);
        this.saveProducts();
        this.toast("محصول حذف شد");
      } else if (this.deleteType === "category") {
        // Move products in this category to uncategorized
        this.products.forEach((p) => {
          if (p.category_id === this.deleteTarget.id) {
            p.category_id = "cat-1";
          }
        });
        this.categories = this.categories.filter((c) => c.id !== this.deleteTarget.id);
        this.saveCategories();
        this.saveProducts();
        this.toast("دسته‌بندی حذف شد");
      }
      this.showDeleteModal = false;
      this.deleteTarget = null;
    },

    // Content management
    saveContent() {
      this.cafeInfo = { ...this.contentForm };
      this.saveCafeInfo();
      this.toast("اطلاعات کافه ذخیره شد");
    },

    // Drag & drop reordering
    dragStartIndex: null,

    dragStart(index) {
      this.dragStartIndex = index;
    },

    dragOver(event) {
      event.preventDefault();
    },

    drop(index) {
      if (this.dragStartIndex === null || this.dragStartIndex === index) return;
      const items = this.activePage === "products" ? this.products : this.categories;
      const [moved] = items.splice(this.dragStartIndex, 1);
      items.splice(index, 0, moved);
      items.forEach((item, i) => (item.order = i));
      if (this.activePage === "products") {
        this.saveProducts();
      } else {
        this.saveCategories();
      }
      this.dragStartIndex = null;
      this.toast("ترتیب به‌روزرسانی شد");
    },

    // Reset to defaults
    resetToDefaults() {
      this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      this.cafeInfo = JSON.parse(JSON.stringify(DEFAULT_CAFE_INFO));
      this.contentForm = { ...this.cafeInfo };
      this.saveCategories();
      this.saveProducts();
      this.saveCafeInfo();
      this.toast("داده‌ها به حالت اولیه بازگشت");
    },

    // Export data as JSON
    exportData() {
      const data = {
        categories: this.categories,
        products: this.products,
        cafeInfo: this.cafeInfo,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aichai-data.json";
      a.click();
      URL.revokeObjectURL(url);
      this.toast("داده‌ها خروجی گرفته شد");
    },

    // Import data from JSON
    importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.categories) this.categories = data.categories;
          if (data.products) this.products = data.products;
          if (data.cafeInfo) {
            this.cafeInfo = data.cafeInfo;
            this.contentForm = { ...this.cafeInfo };
          }
          this.saveCategories();
          this.saveProducts();
          this.saveCafeInfo();
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
        { id: "ORD-1001", customer: "علی محمدی", items: 3, total: 365000, status: "delivered", date: "۱۴۰۴/۰۳/۱۵" },
        { id: "ORD-1002", customer: "سارا احمدی", items: 2, total: 240000, status: "preparing", date: "۱۴۰۴/۰۳/۱۵" },
        { id: "ORD-1003", customer: "رضا کریمی", items: 5, total: 590000, status: "delivered", date: "۱۴۰۴/۰۳/۱۴" },
        { id: "ORD-1004", customer: "مریم حسینی", items: 1, total: 125000, status: "pending", date: "۱۴۰۴/۰۳/۱۴" },
        { id: "ORD-1005", customer: "محمد رضایی", items: 4, total: 480000, status: "delivered", date: "۱۴۰۴/۰۳/۱۳" },
        { id: "ORD-1006", customer: "زهرا نوری", items: 2, total: 230000, status: "cancelled", date: "۱۴۰۴/۰۳/۱۳" },
      ];
    },

    statusBadgeClass(status) {
      const map = { delivered: "badge-green", preparing: "badge-blue", pending: "badge-gold", cancelled: "badge-red" };
      return map[status] || "badge-gold";
    },

    statusLabel(status) {
      const map = { delivered: "تحویل شده", preparing: "در حال آماده‌سازی", pending: "در انتظار", cancelled: "لغو شده" };
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
