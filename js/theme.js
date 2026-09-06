/* ============================================================
   Dark / Light Mode
   ============================================================ */
(function () {
  var STORAGE_KEY = 'mtn-theme';

  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function preferredTheme() {
    var saved = getSavedTheme();
    if (saved === 'dark' || saved === 'light') return saved;
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch (e) { return 'light'; }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark'
        ? (window.I18N && I18N.t('switchToLight') || 'Switch to light mode')
        : (window.I18N && I18N.t('switchToDark') || 'Switch to dark mode'));
    }
  }

  function toggleTheme() {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    applyTheme(next);
  }

  window.ThemeManager = {
    init: function () { applyTheme(preferredTheme()); },
    toggle: toggleTheme
  };

  document.addEventListener('DOMContentLoaded', function () {
    ThemeManager.init();
    var btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  });
})();