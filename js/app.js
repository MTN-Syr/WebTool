/* ============================================================
   MTN Syria Guide - Main Application
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_PROGRESS = 'mtn-progress';
  var STORAGE_VIEWS = 'mtn-views';

  var state = {
    query: '',
    category: null
  };

  /* ---------- Helpers ---------- */

  function lang() { return I18N.currentLang(); }
  function t(key) { return I18N.t(key); }
  function L(o) { return lang() === 'ar' ? o.title_ar : o.title_en; }
  function S(o) { return lang() === 'ar' ? o.summary_ar : o.summary_en; }
  function D(o) { return lang() === 'ar' ? o.description_ar : o.description_en; }
  function Steps(o) { return lang() === 'ar' ? o.steps_ar : o.steps_en; }

  function getCategory(id) {
    return CATEGORIES.find(function (c) { return c.id === id; });
  }
  function catLabel(cat) {
    if (!cat) return '';
    return lang() === 'ar' ? cat.title_ar : cat.title_en;
  }
  function catIcon(cat) {
    return cat ? cat.icon : '📦';
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function getServiceBySlug(slug) {
    return SERVICES_DATA.find(function (s) { return s.id === slug || slugify(s[lang() === 'ar' ? 'title_ar' : 'title_en']) === slug; });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function plural(n, ar1, ar2, en) {
    if (lang() === 'ar') {
      return n === 1 ? ar1 : ar2;
    }
    return en;
  }

  /* ---------- Storage: views & progress ---------- */

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; }
  }
  function writeStore(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
  }
  function recordView(id) {
    var v = readStore(STORAGE_VIEWS);
    v[id] = (v[id] || 0) + 1;
    writeStore(STORAGE_VIEWS, v);
  }
  function viewCount(id) {
    return readStore(STORAGE_VIEWS)[id] || 0;
  }
  function isWatched(id) {
    return !!readStore(STORAGE_PROGRESS)[id];
  }
  function toggleWatched(id) {
    var p = readStore(STORAGE_PROGRESS);
    if (p[id]) delete p[id]; else p[id] = true;
    writeStore(STORAGE_PROGRESS, p);
    updateProgress();
  }

  /* ---------- Video helpers ---------- */

  function parseVideo(url) {
    if (!url) return null;
    url = String(url).trim();

    // Local file
    if (/\.(mp4|webm|ogg|ogv)$/i.test(url)) {
      return { type: 'file', src: url };
    }

    // Google Drive
    var drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (drive) {
      return { type: 'drive', src: 'https://drive.google.com/file/d/' + drive[1] + '/preview' };
    }

    // YouTube (watch, youtu.be, shorts, embed)
    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) {
      return { type: 'youtube', src: 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0' };
    }

    return { type: 'url', src: url };
  }

  function videoHtml(url) {
    var v = parseVideo(url);
    if (!v) return '';
    if (v.type === 'youtube' || v.type === 'drive') {
      return '<div class="video-wrap">' +
        '<iframe src="' + escapeHtml(v.src) + '" ' +
        'title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
        'allowfullscreen loading="lazy"></iframe></div>';
    }
    if (v.type === 'file') {
      return '<div class="video-wrap">' +
        '<video controls preload="metadata" playsinline>' +
        '<source src="' + escapeHtml(v.src) + '">' +
        '</video></div>';
    }
    return '<div class="video-wrap">' +
      '<iframe src="' + escapeHtml(v.src) + '" frameborder="0" allowfullscreen loading="lazy"></iframe></div>';
  }

  /* ---------- Sidebar (categories) ---------- */

  function renderSidebar() {
    var nav = document.getElementById('categoryNav');
    if (!nav) return;
    var html = '';

    html += '<button class="cat-item' + (!state.category ? ' active' : '') + '" data-cat="">' +
      '<span class="cat-icon">🗂️</span><span class="cat-name">' + t('allServices') + '</span>' +
      '<span class="cat-count">' + SERVICES_DATA.length + '</span>' +
      '</button>';

    CATEGORIES.forEach(function (c) {
      var count = SERVICES_DATA.filter(function (s) { return s.category === c.id; }).length;
      html += '<button class="cat-item' + (state.category === c.id ? ' active' : '') + '" data-cat="' + c.id + '">' +
        '<span class="cat-icon">' + c.icon + '</span><span class="cat-name">' + catLabel(c) + '</span>' +
        '<span class="cat-count">' + count + '</span>' +
        '</button>';
    });

    nav.innerHTML = html;

    nav.querySelectorAll('[data-cat]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.category = el.getAttribute('data-cat') || null;
        state.query = '';
        var input = document.getElementById('searchInput');
        if (input) input.value = '';
        renderSidebar();
        App.render();
        closeSidebar();
      });
    });

    var count = document.getElementById('serviceCount');
    if (count) count.textContent = SERVICES_DATA.length;

    renderMobileChips();
  }

  function renderMobileChips() {
    var chips = document.getElementById('mobileCatNav');
    if (!chips) return;
    var html = '';

    html += '<button class="mobile-chip' + (!state.category ? ' active' : '') + '" data-cat="">جميع الخدمات</button>';

    CATEGORIES.forEach(function (c) {
      html += '<button class="mobile-chip' + (state.category === c.id ? ' active' : '') + '" data-cat="' + c.id + '">' +
        c.icon + ' ' + catLabel(c) + '</button>';
    });

    chips.innerHTML = html;

    chips.querySelectorAll('[data-cat]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.category = el.getAttribute('data-cat') || null;
        state.query = '';
        var input = document.getElementById('searchInput');
        if (input) input.value = '';
        renderSidebar();
        App.render();
        chips.classList.remove('open');
      });
    });

    var toggle = document.getElementById('mobileCatToggle');
    if (toggle) {
      toggle.onclick = function () {
        chips.classList.toggle('open');
      };
    }
  }

  /* ---------- Progress ---------- */

  function updateProgress() {
    var p = readStore(STORAGE_PROGRESS);
    var total = SERVICES_DATA.length || 1;
    var done = Object.keys(p).length;
    var percent = Math.round((done / total) * 100);

    var pill = document.getElementById('progressPercent');
    var fill = document.getElementById('progressFill');
    var text = document.getElementById('progressText');

    if (pill) pill.textContent = percent + '%';
    if (fill) fill.style.width = percent + '%';
    if (text) {
      text.textContent = done + ' / ' + total + ' ' + t('progressText') + ' (' + percent + '%)';
    }
  }

  function wireProgressButtons() {
    var btn = document.getElementById('markWatchedBtn');
    if (!btn) return;
    var svc = btn.getAttribute('data-id');
    var watched = isWatched(svc);
    btn.textContent = watched ? t('markUnwatched') : t('markWatched');
    btn.classList.toggle('is-watched', watched);
    btn.addEventListener('click', function () {
      toggleWatched(svc);
      btn.textContent = isWatched(svc) ? t('markUnwatched') : t('markWatched');
      btn.classList.toggle('is-watched', isWatched(svc));
      var badge = document.getElementById('watchedBadge');
      if (badge) badge.style.display = isWatched(svc) ? 'inline-flex' : 'none';
    });
  }

  function wireReset() {
    var btn = document.getElementById('resetProgress');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (confirm(t('resetProgress') + '?')) {
        writeStore(STORAGE_PROGRESS, {});
        updateProgress();
        App.render();
      }
    });
  }

  /* ---------- Service card ---------- */

  function serviceCard(svc) {
    var watched = isWatched(svc.id);
    var views = viewCount(svc.id);
    var href = '#/service/' + svc.id;
    return '<a class="svc-card" href="' + href + '" data-slug="' + svc.id + '">' +
      '<div class="svc-card-top">' +
        '<span class="svc-icon">' + svc.icon + '</span>' +
        (watched ? '<span class="watched-pill">' + t('watchedBadge') + '</span>' : '') +
      '</div>' +
      '<h3 class="svc-title">' + escapeHtml(L(svc)) + '</h3>' +
      '<p class="svc-summary">' + escapeHtml(S(svc)) + '</p>' +
      '<div class="svc-foot">' +
        '<span class="svc-cat">' + catIcon(getCategory(svc.category)) + ' ' + catLabel(getCategory(svc.category)) + '</span>' +
        '<span class="svc-views" title="' + t('viewsLabel') + '">👁 ' + views + '</span>' +
      '</div>' +
    '</a>';
  }

  /* ---------- Home view ---------- */

  function homeView() {
    var list = SERVICES_DATA.filter(function (s) {
      if (state.category && s.category !== state.category) return false;
      return matchesQuery(s);
    });

    var html = '';

    html += '<section class="hero">' +
      '<div class="hero-emoji">📚</div>' +
      '<h1 class="hero-title">' + t('homePageTitle') + '</h1>' +
      '<p class="hero-tagline">' + t('homeTagline') + '</p>' +
      (state.query
        ? '<p class="hero-search-info">› ' + escapeHtml(state.query) + '</p>'
        : '') +
    '</section>';

    html += '<section class="grid-section">' +
      '<div class="section-head"><h2>' + t('homeGridTitle') + ' <span class="count-pill">' + list.length + '</span></h2></div>';

    if (list.length === 0) {
      html += '<div class="empty-state"><div class="empty-ico">🔍</div><p>' + t('searchNoResults') + '</p></div>';
    } else {
      html += '<div class="svc-grid">' + list.map(serviceCard).join('') + '</div>';
    }

    html += '</section>';
    return html;
  }

  /* ---------- Service detail view ---------- */

  function serviceView(svc) {
    var cat = getCategory(svc.category);
    var views = viewCount(svc.id);
    var watched = isWatched(svc.id);

    var related = SERVICES_DATA.filter(function (s) { return s.category === svc.category && s.id !== svc.id; }).slice(0, 3);

    var html = '';

    html += '<button class="btn btn-back" onclick="location.hash=\'#/\'">← ' + t('backHome') + '</button>';

    html += '<article class="detail" id="detail-article">';

    html += '<header class="detail-head">' +
      '<span class="detail-icon">' + svc.icon + '</span>' +
      '<div>' +
        '<h1 class="detail-title">' + escapeHtml(L(svc)) + '</h1>' +
        '<p class="detail-meta">' +
          '<span class="meta-chip">' + catIcon(cat) + ' ' + catLabel(cat) + '</span>' +
          (svc.time_ar ? '<span class="meta-chip">⏱ ' + (lang() === 'ar' ? svc.time_ar : (svc.time_en || svc.time_ar)) + '</span>' : '') +
          '<span class="meta-chip">👁 ' + views + ' ' + t('viewsLabel') + '</span>' +
          '<span id="watchedBadge" class="watched-pill" style="' + (watched ? '' : 'display:none') + '">' + t('watchedBadge') + '</span>' +
        '</p>' +
      '</div>' +
    '</header>';

    var video = parseVideo(svc.video_url);
    if (video) {
      html += '<section class="detail-section">' +
        '<h2 class="section-title">🎬 ' + t('videoTitle') + '</h2>' +
        videoHtml(svc.video_url) +
      '</section>';
    }

    // Description paragraphs
    var paragraphs = D(svc).split(/\n{2,}|\n/).map(function (p) { return p.trim(); }).filter(Boolean);
    var heads = {};
    (svc.heads_ar || []).forEach(function (h) { heads[h] = 1; });
    var imgs = (svc.images_ar || []).filter(function (im) { return im && im.src; });
    var tbls = (svc.tables_ar || []).filter(function (t) { return t && t.rows && t.rows.length; });
    var maxIdx = Math.max(paragraphs.length - 1, 0);
    var figures = {};
    imgs.forEach(function (im) {
      var at = Math.max(0, Math.min((im.after | 0) || 0, maxIdx));
      (figures[at] = figures[at] || []).push(im);
    });
    var tblAt = {};
    tbls.forEach(function (t) {
      var at = Math.max(0, Math.min((t.after | 0) || 0, maxIdx));
      (tblAt[at] = tblAt[at] || []).push(t);
    });
    function figureHtml(im) {
      return '<figure class="detail-figure">' +
        '<img class="detail-img" src="' + escapeHtml(im.src) + '" loading="lazy" alt="' + escapeHtml(im.caption || '') + '" onclick="window.open(this.src)">' +
        (im.caption ? '<figcaption>' + escapeHtml(im.caption) + '</figcaption>' : '') +
        '</figure>';
    }
    function tableHtml(t) {
      var cols = Math.max.apply(null, t.rows.map(function (r) { return r.length; }));
      var head = t.rows.slice(0, 1);
      var body = t.rows.slice(1);
      function fillRow(row, tag) {
        var html = '<tr>';
        for (var i = 0; i < cols; i++) {
          var v = row[i] != null ? row[i] : '';
          html += tag === 'th' ? '<th>' + escapeHtml(v) + '</th>' : '<td>' + escapeHtml(v) + '</td>';
        }
        return html + '</tr>';
      }
      var thead = head.length ? '<thead>' + fillRow(head[0], 'th') + '</thead>' : '';
      var tbody = body.length ? '<tbody>' + body.map(function (r) { return fillRow(r, 'td'); }).join('') + '</tbody>' : '';
      return '<div class="detail-table-wrap"><table class="detail-table">' + thead + tbody + '</table></div>';
    }
    var descHtml = paragraphs.map(function (p, i) {
      return '<p' + (heads[i] ? ' class="desc-head"' : '') + '>' + escapeHtml(p) + '</p>' +
        ((tblAt[i] || []).map(tableHtml).join('')) +
        ((figures[i] || []).map(figureHtml).join(''));
    }).join('');
    html += '<section class="detail-section">' +
      '<div class="detail-desc">' + descHtml + '</div>' +
    '</section>';

    // Steps
    var steps = Steps(svc);
    if (steps && steps.length) {
      html += '<section class="detail-section">' +
        '<h2 class="section-title">🪜 ' + t('stepsTitle') + '</h2>' +
        '<ol class="steps-list">' +
        steps.map(function (step, i) {
          return '<li><span class="step-num">' + (i + 1) + '</span><span class="step-text">' + escapeHtml(step) + '</span></li>';
        }).join('') +
        '</ol>' +
      '</section>';
    }

    html += '</article>';

    // Action bar
    html += '<div class="action-bar">' +
      '<button id="markWatchedBtn" class="btn btn-primary" data-id="' + svc.id + '">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> ' +
        (watched ? t('markUnwatched') : t('markWatched')) +
      '</button>' +
      '<button class="btn btn-outline" id="printBtn" onclick="window.print();">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> ' +
        t('printButton') +
      '</button>' +
    '</div>';

    // Related
    if (related.length) {
      html += '<section class="grid-section">' +
        '<div class="section-head"><h2>' + t('relatedTitle') + '</h2></div>' +
        '<div class="svc-grid">' + related.map(serviceCard).join('') + '</div>' +
      '</section>';
    }

    // Help box
    html += '<div class="help-box">' +
      '<strong>💬 ' + t('needHelp') + '</strong>' +
      '<span>' + t('contactSupport') + '</span>' +
    '</div>';

    return html;
  }

  /* ---------- 404 ---------- */

  function notFoundView() {
    return '<div class="empty-state empty-404">' +
      '<div class="empty-ico">⚠️</div>' +
      '<h2>' + t('notFoundTitle') + '</h2>' +
      '<p>' + t('notFoundText') + '</p>' +
      '<a class="btn btn-primary" href="#/">' + t('backHomeCta') + '</a>' +
    '</div>';
  }

  /* ---------- Router ---------- */

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { name: 'home' };
    if (parts[0] === 'service') {
      return { name: 'service', slug: decodeURIComponent(parts.slice(1).join('/')) || parts[1] };
    }
    return { name: 'notfound' };
  }

  function render() {
    var route = parseHash();
    var content = document.getElementById('appContent');
    var title = (lang() === 'ar' ? 'MTN Syria | كتيب الخدمات التدريبي' : 'MTN Syria | Training Services Guide');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    if (route.name === 'home') {
      content.innerHTML = homeView();
      title = (lang() === 'ar' ? 'الخدمات' : 'Services') + ' • MTN Syria';
    } else if (route.name === 'service') {
      var svc = getServiceBySlug(route.slug);
      if (!svc) {
        content.innerHTML = notFoundView();
      } else {
        recordView(svc.id);
        content.innerHTML = serviceView(svc);
        title = lang() === 'ar' ? svc.title_ar + ' • MTN Syria' : svc.title_en + ' • MTN Syria';
      }
    } else {
      content.innerHTML = notFoundView();
    }

    document.title = title;

    renderSidebar();
    updateProgress();
    wireProgressButtons();
    wireReset();
  }

  /* ---------- Search ---------- */

  function applySearchFilter() {
    renderSidebar();
    App.render();
  }

  function matchesQuery(s) {
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    return [
      s.title_ar, s.title_en,
      s.summary_ar, s.summary_en,
      s.description_ar, s.description_en,
      catLabel(getCategory(s.category))
    ].join(' ').toLowerCase().indexOf(q) !== -1;
  }

  function performSearch() {
    var q = state.query.trim().toLowerCase();
    var input = document.getElementById('searchInput');
    if (input) input.value = state.query;

    var resultsBox = document.getElementById('searchResults');
    if (!resultsBox) return;

    if (!q) {
      resultsBox.innerHTML = '';
      document.getElementById('searchOverlay').hidden = true;
      return;
    }

    var matches = SERVICES_DATA.filter(function (s) {
      var haystack = [
        s.title_ar, s.title_en,
        s.summary_ar, s.summary_en,
        s.description_ar, s.description_en,
        catLabel(getCategory(s.category))
      ].join(' ').toLowerCase();
      return haystack.indexOf(q) !== -1;
    });

    if (matches.length === 0) {
      resultsBox.innerHTML = '<div class="search-empty">' + t('searchNoResults') + '</div>';
      return;
    }

    resultsBox.innerHTML = matches
      .slice(0, 8)
      .map(function (s) {
        return '<a class="search-item" href="#/service/' + s.id + '">' +
          '<span class="search-icon">' + s.icon + '</span>' +
          '<div class="search-meta"><strong>' + escapeHtml(L(s)) + '</strong>' +
          '<small>' + escapeHtml(S(s)) + '</small></div>' +
          '<span class="search-cat">' + catLabel(getCategory(s.category)) + '</span>' +
        '</a>';
      })
      .join('');
  }

  function wireSearch() {
    var toggle = document.getElementById('searchToggle');
    var close = document.getElementById('searchClose');
    var overlay = document.getElementById('searchOverlay');
    var input = document.getElementById('searchInput');

    function open() {
      overlay.hidden = false;
      input.value = state.query;
      input.focus();
      performSearch();
    }
    function closeSearch() {
      overlay.hidden = true;
      input.blur();
    }

    toggle.addEventListener('click', open);
    close.addEventListener('click', closeSearch);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    input.addEventListener('input', function () {
      state.query = input.value;
      performSearch();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        state.query = input.value;
        closeSearch();
        if (!location.hash || location.hash === '#/' || parseHash().name !== 'home') {
          location.hash = '#/';
        }
        applySearchFilter();
      }
      if (e.key === 'Escape') closeSearch();
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); overlay.hidden ? open() : closeSearch(); }
    });
  }

  /* ---------- Responsive sidebar ---------- */

  function wireSidebarToggle() {
    // Toggle sidebar on small screens via a floating button rendered in sidebar header
    document.body.classList.remove('sidebar-open');
  }

  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
  }

  /* ---------- Init ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    wireSearch();
    window.addEventListener('hashchange', function () {
      applySearchFilter();
    });

    // Re-render after language change needs clean re-render (App exposed)
    if (window.I18N) {
      // language init is handled in i18n.js
    }
    document.documentElement.classList.add('js');
    App.render();
    document.getElementById('year').textContent = new Date().getFullYear();
  });

  window.App = {
    render: render,
    applySearchFilter: applySearchFilter,
    setQuery: function (q) { state.query = q || ''; },
    getState: function () { return state; }
  };
})();