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

  // دمج تشغيلات الغامق المتجاورة (مطابق لمستورد Word)
  function mergeBold(s) {
    var prev;
    do {
      prev = s;
      s = s.replace(/\*\*([^*\n]+)\*\*\*\*([^*\n]+)\*\*/g, '**$1$2**');
      s = s.replace(/\*\*\s*\*\*/g, '');
    } while (s !== prev);
    return balanceBoldStars(s);
  }

  // عدد فردي من ** (تشغيلة غامقة غير مقفلة) — نحذف الأخيرة لتجنّب نجمتين فضوليتين
  function balanceBoldStars(s) {
    var stars = s.match(/\*\*/g) || [];
    if (stars.length % 2 === 1) {
      var last = s.lastIndexOf('**');
      if (last >= 0) s = s.slice(0, last) + s.slice(last + 2);
    }
    return s;
  }

  // نص مع تحويل b/strong إلى **غامق** (بدون تداخل ينتج ****)
  function richText(node) {
    var out = '';
    function walk(n, bold) {
      if (n.nodeType === 3) {
        if (!n.textContent) return;
        out += bold ? '**' + n.textContent + '**' : n.textContent;
        return;
      }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toLowerCase();
      var isB = tag === 'b' || tag === 'strong';
      if (tag === 'br' || tag === 'wbr' || tag === 'hr') { out += ' '; return; }
      Array.prototype.forEach.call(n.childNodes, function (ch) { walk(ch, bold || isB); });
    }
    walk(node, false);
    return mergeBold(clean(out));
  }

  function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // ملخص أوضح: أول فقرة وصفية ليست عنواناً ولا نقطة ولا خطوة مرقمة
  function makeSummary(desc, heads, meta, lang) {
    var t = (meta && meta.title_ar) || '';
    var titleRe = null;
    if (t) titleRe = new RegExp('^' + escapeRegExp(String(t).trim()) + '[:؛]?$');
    for (var i = 0; i < desc.length; i++) {
      var p = (desc[i] || '').replace(/\*\*/g, '').replace(/[ \t\u00A0]+/g, ' ').trim();
      if (!p || p.length < 20) continue;
      if (heads.indexOf(i) >= 0) continue;
      if (/^[•\u2013\u2014]\s/.test(p)) continue;
      if (/^\s*\d+\s*[-.)–]\s/.test(p)) continue;
      if (titleRe && titleRe.test(p)) continue;
      return (p.length > 170 ? p.slice(0, 170) + '…' : p);
    }
    var fallback = (desc.filter(function (x) { return x && x.trim(); })[0] || '').replace(/\*\*/g, '').trim();
    return (fallback.length > 170 ? fallback.slice(0, 170) + '…' : fallback);
  }

  // جدول HTML يحافظ على دمج الصفوف والأعمدة بنفس تنسيق مستورد Word
  function parseHtmlTable(tableEl) {
    var trs = tableEl.querySelectorAll('tr');
    if (!trs.length) return null;
    var rows = [];
    var active = [];
    var i;
    for (i = 0; i < trs.length; i++) {
      var tr = trs[i];
      var tds = tr.querySelectorAll('td, th');
      if (!tds.length) continue;
      var covered = {};
      active.forEach(function (s) { if (s.left > 0) { var c; for (c = s.col; c < s.col + s.cs; c++) covered[c] = true; } });
      var cells = [];
      var ci = 0, k;
      for (k = 0; k < tds.length; k++) {
        while (covered[ci]) { cells.push({ t: '', rs: 0, cs: 1 }); ci++; }
        var td = tds[k];
        var rsRaw = Math.max(parseInt(td.getAttribute('rowspan') || '1', 10) || 1, 1);
        var csRaw = Math.max(parseInt(td.getAttribute('colspan') || '1', 10) || 1, 1);
        rsRaw = Math.min(rsRaw, trs.length - i);
        var cell = { t: richText(td) };
        if (csRaw > 1) cell.cs = csRaw;
        if (rsRaw > 1) { cell.rs = rsRaw; active.push({ col: ci, cs: csRaw, left: rsRaw }); }
        cells.push(cell);
        var c2;
        for (c2 = ci; c2 < ci + csRaw; c2++) covered[c2] = true;
        ci += csRaw;
      }
      active.forEach(function (s) { s.left--; });
      if (!cells.length) continue;
      rows.push(cells);
    }
    return rows.length ? rows : null;
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
        var tx = richText(node);
        if (tx) push(tx, 'phrase');
        return;
      }
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'form') return;
      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') { push(textOfNode(node), 'heading'); return; }
      if (tag === 'li') {
        var li = richText(node);
        if (li) push(li, 'list');
        return;
      }
      if (tag === 'tr') {
        var cells = Array.prototype.map.call(node.querySelectorAll('td, th'), richText).filter(Boolean);
        if (cells.length) parts.push({ type: 'row', cells: cells });
        return;
      }
      if (tag === 'img') {
        var isrc = node.getAttribute('src') || node.getAttribute('data-src') || '';
        if (isrc) push(isrc, 'img');
        return;
      }
      if (tag === 'table') {
        var tblRows = parseHtmlTable(node);
        if (tblRows && tblRows.length) parts.push({ type: 'tbl', rows: tblRows });
        return;
      }
      if (tag === 'p' || tag === 'div') {
        var p = richText(node);
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
        // جدول بعمود واحد = قائمة تُعرض كفقرات (مطابق لمستورد Word)
        var singleCol = p.rows.every(function (r) {
          return r.filter(function (c) { return c.rs !== 0; }).length === 1;
        });
        if (singleCol) {
          p.rows.forEach(function (r) {
            var real = r.filter(function (c) { return c.rs !== 0 && (c.t || '').trim(); })[0];
            if (real && (real.t || '').trim()) desc.push(real.t.trim());
          });
          return;
        }
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

    var summary = makeSummary(desc, heads, meta, lang);

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

  // يولّد الحزمة المجزأة: index.js + ملف لكل خدمة داخل data/services/
  function generateSplitPackage(services, cats) {
    var files = {};
    var ordered = serviceFileNames(services);
    var indexJs =
      '/* ============================================================\n' +
      '   فهرس الخدمات — يُعرّف التصنيفات ويحمّل ملفات كل خدمة منفصلة.\n' +
      '   كل ملف service/<id>.js يُضيف خدمته إلى SERVICES_DATA.\n' +
      '   ============================================================ */\n\n' +
      'var SERVICES_DATA = [];\n\n' +
      'var SERVICE_FILES = ' + JSON.stringify(ordered, null, 2) + ';\n\n' +
      'var CATEGORIES = ' + JSON.stringify(cats, null, 2) + ';\n\n' +
      '/* تحميل ملفات الخدمات المنفصلة */\n' +
      '(function () {\n' +
      '  var base = "data/services/";\n' +
      '  var scripts = document.getElementsByTagName(\'script\');\n' +
      '  for (var i = 0; i < scripts.length; i++) {\n' +
      '    var src = scripts[i].getAttribute(\'src\') || \'\';\n' +
      '    var idx = src.indexOf(\'data/services/index.js\');\n' +
      '    if (idx !== -1) { base = src.slice(0, idx + \'data/services/\'.length); break; }\n' +
      '  }\n' +
      '  SERVICE_FILES.forEach(function (f) {\n' +
      '    document.write(\'<script src="\' + base + f + \'"><\\/script>\');\n' +
      '  });\n' +
      '})();\n';
    files['index.js'] = indexJs;

    services.forEach(function (s) {
      files[s.id + '.js'] =
        '/* ============================================================\n' +
        '   الخدمة: ' + (s.title_ar || s.id) + ' / ' + (s.title_en || '') + '\n' +
        '   الملف منفصل لكل خدمة — أُنشئ تلقائياً.\n' +
        '   ============================================================ */\n\n' +
        '(function () {\n' +
        '  var root = (typeof window !== "undefined") ? window : globalThis;\n' +
        '  root.SERVICES_DATA = root.SERVICES_DATA || [];\n' +
        '  root.SERVICES_DATA.push(' + JSON.stringify(s) + ');\n' +
        '})();\n';
    });
    return files;
  }

  function serviceFileNames(services) {
    return services.map(function (s) { return s.id + '.js'; }).sort();
  }

  function merge(existing, incoming) {
    var map = {};
    var titleMap = {};
    existing.forEach(function (s) {
      map[s.id] = s;
      if (s.title_ar) titleMap[s.title_ar.trim().toLowerCase()] = s.id;
    });
    var added = 0, updated = 0;
    incoming.forEach(function (s) {
      var matchId = s.id;
      if (!map[matchId] && s.title_ar && titleMap[s.title_ar.trim().toLowerCase()]) {
        matchId = titleMap[s.title_ar.trim().toLowerCase()];
        s.id = matchId;
      }
      if (map[matchId]) { map[matchId] = s; updated++; }
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
    generateSplitPackage: generateSplitPackage,
    merge: merge,
    ICONS: ICONS,
  };
})();