/**
 * utils.js — Shared utility functions
 * Persian number formatting, price display, localStorage wrappers, helpers.
 */

const Utils = {
  PERSIAN_DIGITS: ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"],

  /**
   * Convert Western digits to Persian digits.
   */
  toPersianNum(num) {
    if (num == null) return "";
    return String(num).replace(/\d/g, (d) => this.PERSIAN_DIGITS[+d]);
  },

  /**
   * Format a price in Toman with Persian digits and comma separators.
   * e.g. 125000 → "۱۲۵,۰۰۰ تومان"
   */
  formatPrice(toman) {
    if (toman == null) return "";
    const withCommas = Number(toman).toLocaleString("en-US");
    return this.toPersianNum(withCommas) + " تومان";
  },

  /**
   * Simple debounce function.
   */
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  },

  /**
   * Generate a simple unique ID.
   */
  generateId() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  },

  /**
   * localStorage get with JSON parse and fallback.
   */
  getStorage(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * localStorage set with JSON stringify.
   */
  setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  },

  /**
   * Remove item from localStorage.
   */
  removeStorage(key) {
    localStorage.removeItem(key);
  },

  /**
   * Clamp a number between min and max.
   */
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  /**
   * Create a simple Jalali date string (basic approximation).
   */
  toPersianDate(date) {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date || new Date());
    } catch {
      return "";
    }
  },

  /**
   * Persian relative time (basic).
   */
  timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "لحظاتی پیش";
    if (seconds < 3600) return this.toPersianNum(Math.floor(seconds / 60)) + " دقیقه پیش";
    if (seconds < 86400) return this.toPersianNum(Math.floor(seconds / 3600)) + " ساعت پیش";
    return this.toPersianNum(Math.floor(seconds / 86400)) + " روز پیش";
  },
};
