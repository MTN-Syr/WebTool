/* HTML import module — يستخرج خدمات من صفحات CC Web Tool المحفوظة */
(function () {
  'use strict';

  var CUT = /(التعليمات التقنية|الأوامر التقنية|الاوامر التقنية|تقنيه|CRMS|M2000|الخوارزمية|البرمجة التالية|SQL|Processing|البيانات التقنية|Rockwell|Monitoring|Suspension|Bill Ceiling|Dunning|Local Deposit|Bill Instalment|المحتويات\s*:\s*$)/i;
  var NUMBERED = /^\s*[0-9٠-٩]{1,2}\s*[ًٌٍَُِّْ]*\s*[-.)–]\s*(\d{1,2}\s*[-.)–]\s*)?/;
  var METHOD_HEAD = /طريقة|خطوات|إجراءات|الخطوات|كيفية/;

  var FALLBACK_CATS = {
    'إلغاء الاشتراك بالخط': 'c-cancel',
    'الاشتراك بالخط': 'c-lines',
    'الوثائق المقبولة': 'c-lines',
    'حجز الرقم': 'c-lines',
    'خليك معنا': 'c-promo',
    'رقم مميز': 'c-number',
    'رقم جميل': 'c-number',
    'pick your number': 'c-number',
    'annual validity': 'c-validity',
    'صلاحية': 'c-validity',
    'puk': 'c-security',
    'security': 'c-security',
    'pin': 'c-security',
  };

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#8211;/g, '–')
      .replace(/&#8217;/g, "'")
      .replace(/&#8230;/g, '…')
      .replace(/&#8212;/g, '—')
      .replace(/\s+/g, ' ').trim();
  }

  function textOfNode(node) {
    return clean(node.textContent || '');
  }

  function isArabic(t) {
    var ar = (t.match(/[\u0600-\u06FF]/g) || []).length;
    var total = t.replace(/\s/g, '').length || 1;
    return ar / total > 0.15;
  }

  function slugify(t) {
    return String(t || '')
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim().toLowerCase()
      .replace(/-+/g, '-');
  }

  function detectCategory(title) {
    var t = String(title || '').toLowerCase();
    for (var key in FALLBACK_CATS) {
      if (t.indexOf(key.toLowerCase()) >= 0) return FALLBACK_CATS[key];
    }
    return 'c-lines';
  }

  var ICONS = { 'c-lines': '📱', 'c-cancel': '🗑️', 'c-validity': '⏳', 'c-number': '🔢', 'c-security': '🔐', 'c-promo': '🎁', 'c-other': '📄' };

  function extractService(html, meta) {
    meta = meta || {};
    var doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (e) { return { error: 'تعذر فك ترميز الملف' }; }

    var t = doc.querySelector('title');
    var title = meta.title || (t ? clean(t.textContent).replace(/[–\-]\s*CC Web Tool\s*$/i, '').trim() : 'غير معروف');

    var entry = doc.querySelector('.entry-content, .post-content, .entry-content.clear');
    if (!entry) entry = doc.querySelector('article, main');
    if (!entry) return { error: 'لم يُعثر على محتوى المقال داخل الملف' };

    // عزل الأقسام غير المرغوبة
    var clone = entry.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('script,style,nav,header,footer,form'), function (el) { el.parentNode.removeChild(el); });

    var files = meta.files || {}; // {basename: dataURL}
    var missingImgs = [];
    var parts = [];
    var cut = false;
    var push = function (txt, type) {
      if (type === 'img') {
        var src = txt;
        var m = /(?:^|\/)([\w\u0600-\u06FF\u00C0-\u024F. ()%_-]+\.(?:png|jpe?g|gif|svg|webp|bmp))$/i.exec(src);
        var base = m ? m[1] : src;
        if (/^data:/i.test(src)) { parts.push({ type: 'img', src: src, missing: false }); return; }
        if (files[base] || files[src] || files[decodeURIComponent(base)]) {
          parts.push({ type: 'img', src: files[base] || files[src] || files[decodeURIComponent(base)], missing: false });
        } else {
          parts.push({ type: 'img', src: src, missing: true });
          missingImgs.push(base);
        }
        return;
      }
      txt = txt.trim();
      if (!txt) return;
      if (CUT.test(txt)) { cut = true; return; }
      var last = parts[parts.length - 1];
      if (type === 'list' && last && last.type === 'list') { last.items.push(txt); return; }
      if (last && last.type === 'phrase' && last.text === txt) return;
      parts.push(type === 'list' ? { type: 'list', items: [txt] } : { type: type || 'phrase', text: txt });
    };
    var walk = function (node) {
      if (cut) return;
      if (node.nodeType === 3) {
        var tx = clean(node.textContent);
        if (tx) push(tx, 'phrase');
        return;
      }
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'form') return;
      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') { push(textOfNode(node), 'heading'); return; }
      if (tag === 'li') {
        var li = textOfNode(node);
        if (li) push(li, 'list');
        return;
      }
      if (tag === 'tr') {
        var cells = Array.prototype.map.call(node.querySelectorAll('td, th'), textOfNode).filter(Boolean);
        if (cells.length) parts.push({ type: 'row', cells: cells });
        return;
      }
      if (tag === 'img') {
        var isrc = node.getAttribute('src') || node.getAttribute('data-src') || '';
        if (isrc) push(isrc, 'img');
        return;
      }
      if (tag === 'table') {
        var rows = Array.prototype.map.call(node.querySelectorAll('tr'), function (tr) {
          return Array.prototype.map.call(tr.querySelectorAll('td, th'), textOfNode);
        }).filter(function (r) { return r.some(function (c) { return Boolean(c); }); });
        if (rows.length) parts.push({ type: 'tbl', rows: rows });
        return;
      }
      if (tag === 'p' || tag === 'div') {
        var p = textOfNode(node);
        if (p && p.length < 400) {
          // عنصر كتلة نصي قصير — يعامل كفقرة
          if (node.children.length === 0 || /^<p\b/i.test(node.outerHTML.slice(0, 40))) { push(p, 'phrase'); return; }
        }
      }
      // descend
      Array.prototype.forEach.call(node.childNodes, walk);
    };
    Array.prototype.forEach.call(clone.childNodes, walk);

    // clean redundant duplicates about "اضغط هنا"
    var desc = [];
    var steps = [];
    var images = [];
    var tables = [];
    var heads = [];
    var inMethod = false;
    parts.forEach(function (p) {
      if (p.type === 'tbl') {
        tables.push({ after: Math.max(desc.length - 1, 0), rows: p.rows, caption: '' });
        return;
      }
      if (p.type === 'img') {
        if (p.src.indexOf('data:') !== 0) return;
        images.push({ after: Math.max(desc.length - 1, 0), src: p.src, caption: '' });
        return;
      }
      if (p.type === 'heading') {
        desc.push(p.text);
        heads.push(desc.length - 1);
        inMethod = METHOD_HEAD.test(p.text);
        return;
      }
      if (p.type === 'img') {
        if (p.src.indexOf('data:') !== 0) return;
        images.push({ after: Math.max(desc.length - 1, 0), src: p.src, caption: '' });
        return;
      }
      if (p.type === 'phrase') {
        desc.push(p.text);
        if (NUMBERED.test(p.text)) {
          if (inMethod) steps.push(cleanStep(p.text));
        }
        return;
      }
      if (p.type === 'list') { desc.push.apply(desc, p.items); if (inMethod) steps.push.apply(steps, p.items.map(cleanStep)); return; }
    });
    if (steps.length === 0) {
      // fallback: bonus numbered run
      var runs = []; var cur = [];
      parts.forEach(function (p) {
        if (p.type === 'phrase' && NUMBERED.test(p.text)) cur.push(cleanStep(p.text));
        else if (cur.length) { runs.push(cur); cur = []; }
      });
      if (cur.length) runs.push(cur);
      var best = runs.reduce(function (a, b) { return (a && a.length >= b.length ? a : b); }, null);
      if (best) steps = best.slice(0, 40);
    }

    // inMethod-based steps may be empty; prefer method steps
    if (steps.length === 0 && desc.length === 0) return { error: 'لا يوجد محتوى نصي مفهوم في الملف' };

    // فيديو
    var video = meta.video_url || '';
    if (!video) {
      var ifr = doc.querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"], video[src], iframe[src*="drive.google"]');
      if (ifr) video = ifr.getAttribute('src') || ifr.getAttribute('data-src') || '';
      if (!video) {
        var a = doc.querySelector('a[href*="youtube"], a[href*="youtu.be"], a[href*=".mp4"], a[href*="drive.google"]');
        if (a) video = a.getAttribute('href');
      }
    }

    // لغة
    var lang = isArabic(desc.join('\n')) ? 'ar' : 'en';
    var id = meta.id || slugify(meta.title_ar || title);
    var cat = meta.category || detectCategory(title);
    var icon = meta.icon || ICONS[cat] || '📄';

    var summary = desc[1] || desc[0] || '';
    if (summary.length > 170) summary = summary.slice(0, 170) + '…';

    return {
      file: meta.file || '',
      lang: lang,
      id: id,
      category: cat,
      icon: icon,
      title_ar: meta.title_ar || (lang === 'ar' ? title : ''),
      title_en: meta.title_en || (lang === 'en' ? title : ''),
      sourceTitle: title,
      summary_ar: lang === 'ar' ? summary : (meta.summary_ar || summary),
      summary_en: lang === 'en' ? summary : (meta.summary_en || summary),
      description_ar: desc.join('\n\n'),
      description_en: lang === 'en' ? desc.join('\n\n') : (meta.summary_en || '') + '(التفاصيل الكاملة منشورة بالعربية)' || desc.join('\n\n'),
      steps_ar: lang === 'ar' ? steps : [],
      steps_en: lang === 'en' ? steps : [],
      heads_ar: heads,
      video_url: video,
      images_ar: images.length ? images : [],
      tables_ar: tables.length ? tables : [],
      missing_images: missingImgs.filter(function (v, i, a) { return a.indexOf(v) === i; }),
      time_ar: meta.time_ar || '',
      time_en: meta.time_en || '',
    };
  }

  function cleanStep(t) {
    return t.replace(NUMBERED, '').trim();
  }

  function generateCode(services, cats) {
    return '// بيانات الخدمات — مُولَّدة بواسطة tools/html-to-site.html (ملفات CC Web Tool المحفوظة).\n\n'
      + 'const SERVICES_DATA = ' + JSON.stringify(services, null, 2) + ';\n\n'
      + 'const CATEGORIES = ' + JSON.stringify(cats, null, 2) + ';\n';
  }

  function merge(existing, incoming) {
    var map = {};
    existing.forEach(function (s) { map[s.id] = s; });
    var added = 0, updated = 0;
    incoming.forEach(function (s) {
      if (map[s.id]) { map[s.id] = s; updated++; }
      else { map[s.id] = s; added++; }
    });
    return {
      services: Object.keys(map).map(function (k) { return map[k]; }),
      added: added,
      updated: updated,
    };
  }

  window.HtmlImport = {
    extractService: extractService,
    slugify: slugify,
    detectCategory: detectCategory,
    generateCode: generateCode,
    merge: merge,
    ICONS: ICONS,
  };
})();