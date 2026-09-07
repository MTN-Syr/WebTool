/* ============================================================
   Bilingual support: العربية / English (RTL / LTR)
   ============================================================ */
(function () {
  var STORAGE_KEY = 'mtn-lang';

  var TRANSLATIONS = {
    ar: {
      brandTitle: 'كتيب الخدمات التدريبي',
      brandSub: 'MTN Syria',
      ariaBrand: 'MTN Syria - الرئيسية',
      ariaSearch: 'بحث',
      ariaTheme: 'تبديل الوضع الليلي',
      ariaClose: 'إغلاق',
      ariaLang: 'اللغة',
      switchToDark: 'تفعيل الوضع الداكن',
      switchToLight: 'تفعيل الوضع الفاتح',
      searchPlaceholder: 'ابحث عن خدمة...',
      searchNoResults: 'لا توجد نتائج مطابقة',
      searchShowAll: 'عرض جميع النتائج',
      resultOne: 'نتيجة',
      resultMany: 'نتائج',
      categoriesTitle: 'التصنيفات',
      allServices: 'جميع الخدمات',
      pageTitleSuffix: ' — كتيب الخدمات',
      homePageTitle: 'كيف أساعدك اليوم؟',
      homeTagline: 'كتيب التعريف بخدمات MTN Syria للمتدربين الجدد',
      homeGridTitle: 'الخدمات المتوفرة',
      noServicesInCategory: 'لا توجد خدمات في هذا التصنيف',
      viewService: 'عرض الشرح والفيديو عرض شرح',
      stepsTitle: 'خطوات التنفيذ',
      videoTitle: 'الفيديو التوضيحي',
      needHelp: 'تحتاج مساعدة؟',
      contactSupport: 'تواصل مع مدربك أو فرق الدعم',
      backHome: 'العودة إلى الرئيسية',
      notFoundTitle: 'الصفحة غير موجودة',
      notFoundText: 'عذراً، لا توجد نتيجة لهذا الطلب.',
      backHomeCta: 'العودة إلى الرئيسية',
      catLabel: 'التصنيف:',
      timeLabel: 'الزمن المتوقع:',
      viewsLabel: 'عدد المشاهدات',
      printButton: 'تصدير PDF',
      printTitle: 'تصدير PDF للخدمة',
      allCats: 'جميع الخدمات',
      relatedTitle: 'خدمات أخرى في نفس التصنيف',
      openMenu: 'فتح قائمة التصنيفات',
      closeMenu: 'إغلاق القائمة'
    },
    en: {
      brandTitle: 'Services Training Guide',
      brandSub: 'MTN Syria',
      ariaBrand: 'MTN Syria - Home',
      ariaSearch: 'Search',
      ariaTheme: 'Toggle dark mode',
      ariaClose: 'Close',
      ariaLang: 'Language',
      switchToDark: 'Switch to dark mode',
      switchToLight: 'Switch to light mode',
      searchPlaceholder: 'Search for a service...',
      searchNoResults: 'No matching results',
      searchShowAll: 'Show all results',
      resultOne: 'result',
      resultMany: 'results',
      categoriesTitle: 'Categories',
      allServices: 'All Services',
      pageTitleSuffix: ' — Services Guide',
      homePageTitle: 'How can I help today?',
      homeTagline: 'MTN Syria services introduction guide for new trainees',
      homeGridTitle: 'Available Services',
      noServicesInCategory: 'No services in this category',
      viewService: 'View explanation & video',
      stepsTitle: 'Execution Steps',
      videoTitle: 'Explanatory Video',
      needHelp: 'Need help?',
      contactSupport: 'Contact your trainer or support teams',
      backHome: 'Back to Home',
      notFoundTitle: 'Page Not Found',
      notFoundText: 'Sorry, no results for this request.',
      backHomeCta: 'Back to Home',
      catLabel: 'Category:',
      timeLabel: 'Estimated time:',
      viewsLabel: 'Views',
      printButton: 'Export PDF',
      printTitle: 'Export service as PDF',
      allCats: 'All Services',
      relatedTitle: 'Other services in the same category',
      openMenu: 'Open categories menu',
      closeMenu: 'Close menu'
    }
  };

  function savedLang() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function currentLang() {
    var s = savedLang();
    return (s === 'ar' || s === 'en') ? s : 'ar';
  }

  function setLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.title = (lang === 'ar' ? 'MTN Syria | كتيب الخدمات التدريبي' : 'MTN Syria | Training Services Guide');
    applyStaticTranslations();
  }

  function t(key) {
    var lang = currentLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.ar[key] || key;
  }

  function applyStaticTranslations() {
    // data-i18n -> textContent, data-i18n-placeholder -> placeholder
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
    var langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.textContent = currentLang() === 'ar' ? 'EN' : 'ع';
    document.documentElement.setAttribute('data-lang', currentLang());
  }

  window.I18N = {
    t: t,
    currentLang: currentLang,
    setLang: setLang,
    apply: applyStaticTranslations
  };

  document.addEventListener('DOMContentLoaded', function () {
    var current = currentLang();
    setLang(current);
    var btn = document.getElementById('langToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = currentLang() === 'ar' ? 'en' : 'ar';
        setLang(next);
        if (window.App) App.render();
      });
    }
  });
})();