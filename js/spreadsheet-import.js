/* ============================================================
   SpreadsheetImport — core logic (pure functions, no DOM)
   تحويل بيانات الإكسل/CSV إلى Services/Categories للموقع
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- تطبيع الترويسة ---------- */
  function norm(v) {
    var t = String(v || '');
    t = t.replace(/\([^)]*\)/g, '');                       // حذف ما بين قوسين
    t = t.replace(/[\u064B-\u0654]/g, '');                 // حذف التشكيل
    t = t.replace(/[أإآ]/g, 'ا').replace(/ؤ/g, 'و').replace(/ى/g, 'ي'); // توحيد الهمزات
    t = t.toLowerCase();
    return t.replace(/[\s_\-،,()\\/]+/g, '');
  }

  /* ---------- خريطة الحقول والأسماء البديلة ---------- */
  var FIELDS = {
    id: ['id', 'serviceid', 'معرفالخدمة', 'الخدمةid', 'المعرّف'],
    category: ['category', 'التصنيف', 'الفئة'],
    icon: ['icon', 'الايقونة', 'الرمز', 'ايقونة'],
    title_ar: ['titlear', 'العنوانبالعربية', 'العنوان', 'arabictitle'],
    title_en: ['titleen', 'العنوانبالإنجليزية', 'englishtitle', 'titleenglish'],
    summary_ar: ['summaryar', 'الملخصبالعربية', 'الوصفالمختصر', 'الملخص'],
    summary_en: ['summaryen', 'الملخصبالإنجليزية', 'englishsummary'],
    description_ar: ['descriptionar', 'الشرحبالعربية', 'الوصفبالعربية', 'الشرح', 'الوصف'],
    description_en: ['descriptionen', 'الشرحبالإنجليزية', 'englishdescription', 'الوصفبالإنجليزية'],
    steps_ar: ['stepsar', 'الخطواتبالعربية', 'الخطوات', 'arabicsteps'],
    steps_en: ['stepsen', 'الخطواتبالإنجليزية', 'englishsteps'],
    video_url: ['videourl', 'رابطالفيديو'],
    time_ar: ['timear', 'الزمنبالعربية', 'المدةبالعربية', 'الزمن', 'المدة'],
    time_en: ['timeen', 'الزمنبالإنجليزية', 'duration'],
    cat_icon: ['categoryicon', 'ايقونةالتصنيف'],
    cat_ar: ['categoryar', 'اسمالتصنيفبالعربية', 'التصنيفبالعربية'],
    cat_en: ['categoryen', 'اسمالتصنيفبالإنجليزية', 'categoryenglish']
  };

  var FIELDS_ORDER = ['id', 'category', 'icon', 'title_ar', 'title_en', 'summary_ar', 'summary_en', 'description_ar', 'description_en', 'steps_ar', 'steps_en', 'video_url', 'time_ar', 'time_en', 'cat_icon', 'cat_ar', 'cat_en'];

  var FIELDS_NORM = {};
  Object.keys(FIELDS).forEach(function (f) { FIELDS_NORM[f] = FIELDS[f].map(norm); });

  /* ---------- بارس CSV (RFC4180 + BOM) بدون مكتبات ---------- */
  function parseCsv(text) {
    text = String(text || '');
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var rows = [], row = [], field = '', inQ = false, i = 0;
    while (i < text.length) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        field += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c === '\r') { /* تجاهل */ }
        else { field += c; }
      }
      i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }

  /* ---------- كشف الترويسة → خريطة (field → column) ---------- */
  function detectHeaders(headerRow) {
    var map = {};
    if (headerRow) {
      headerRow.forEach(function (h, i) {
        var n = norm(h);
        if (!n) return;
        for (var f in FIELDS_NORM) {
          if (FIELDS_NORM[f].indexOf(n) !== -1 && !(f in map)) map[f] = i;
        }
      });
    }
    // احتياطي: وضع افتراضي حسب العمود إذا لم تكتشف الترويسة
    if (Object.keys(map).length < 8) {
      map = {};
      FIELDS_ORDER.forEach(function (f, i) { map[f] = i; });
      map._fallback = true;
    }
    return map;
  }

  /* ---------- قراءة قيمة خلية (سلسلة/رقم/خلية SheetJS) ---------- */
  function cellV(row, col) {
    if (col === undefined) return '';
    var v = row && row[col];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') {
      if (typeof v.w !== 'undefined') v = v.w;
      else if (typeof v.v !== 'undefined') v = v.v;
    }
    return String(v).trim();
  }

  /* ---------- تقسيم الخطوات ---------- */
  function splitSteps(v) {
    if (!v) return [];
    return String(v)
      .split(/\r?\n|\s*\|\s*|\uff1b/)
      .map(function (s) { return s.trim().replace(/^\d+[.).\u066b]?\s*/, ''); })
      .filter(Boolean);
  }

  /* ---------- slugify ---------- */
  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  /* ---------- بناء التصنيفات ---------- */
  function buildCategories(dataRows, map, builtinCats) {
    builtinCats = builtinCats || [];
    var seen = {}, order = [];
    dataRows.forEach(function (r) {
      var catId = cellV(r, map.category);
      if (!catId) return;
      if (!seen[catId]) { seen[catId] = { ar: '', en: '', icon: '' }; order.push(catId); }
      var ar = cellV(r, map.cat_ar);
      var en = cellV(r, map.cat_en);
      var ic = cellV(r, map.cat_icon);
      if (ar && !seen[catId].ar) seen[catId].ar = ar;
      if (en && !seen[catId].en) seen[catId].en = en;
      if (ic && !seen[catId].icon) seen[catId].icon = ic;
    });
    var cats = [];
    order.forEach(function (id) {
      var info = seen[id];
      var built = builtinCats.filter(function (c) { return c.id === id; })[0];
      cats.push({
        id: id,
        icon: info.icon || (built ? built.icon : '📦'),
        title_ar: info.ar || (built ? built.title_ar : id),
        title_en: info.en || (built ? built.title_en : id)
      });
    });
    // أضف التصنيفات المدمجة الباقية في نهايتها (حتى لا تختفي عند الاستبدال)
    builtinCats.forEach(function (b) {
      if (!cats.some(function (c) { return c.id === b.id; })) cats.push(JSON.parse(JSON.stringify(b)));
    });
    return cats;
  }

  /* ---------- بناء الخدمات (دمج أو استبدال) ---------- */
  function buildServices(dataRows, map, opts) {
    opts = opts || {};
    var mode = opts.mode || 'merge';
    var builtin = opts.builtin || [];
    var builtinCats = opts.builtinCats || [];
    var issues = [];
    var seenIds = {};

    var base, baseIndex = {};
    if (mode === 'merge') { base = builtin.map(function (s) { return JSON.parse(JSON.stringify(s)); }); }
    else { base = []; }
    base.forEach(function (s) { baseIndex[s.id] = true; });

    dataRows.forEach(function (r, idx) {
      var titleAr = cellV(r, map.title_ar);
      var titleEn = cellV(r, map.title_en);
      if (!titleAr && !titleEn) {
        issues.push({ level: 'warn', text: 'الصف ' + (idx + 1) + ': صف فارغ — تم تخطيه' });
        return;
      }
      var id = cellV(r, map.id);
      if (!id) {
        id = slugify(titleAr || titleEn || ('service-' + (idx + 1)));
        if (!id) id = 'service-' + (idx + 1);
        issues.push({ level: 'warn', text: 'الخدمة "' + (titleAr || titleEn) + '": لا يوجد معرّف، تم توليده تلقائياً (' + id + ')' });
      }
      if (seenIds[id]) {
        issues.push({ level: 'warn', text: 'الخدمة "' + (titleAr || titleEn) + '": معرّف مكرر (' + id + ') — تم استخدام آخر نسخة' });
      }
      seenIds[id] = true;

      var category = cellV(r, map.category) || 'c-other';
      var svc = {
        id: id,
        category: category,
        icon: cellV(r, map.icon) || '📦',
        title_ar: titleAr || titleEn,
        title_en: titleEn || titleAr,
        summary_ar: cellV(r, map.summary_ar),
        summary_en: cellV(r, map.summary_en),
        description_ar: cellV(r, map.description_ar),
        description_en: cellV(r, map.description_en),
        steps_ar: splitSteps(cellV(r, map.steps_ar)),
        steps_en: splitSteps(cellV(r, map.steps_en)),
        video_url: cellV(r, map.video_url),
        time_ar: cellV(r, map.time_ar),
        time_en: cellV(r, map.time_en)
      };

      if (baseIndex[id]) {
        var ix = base.findIndex(function (s) { return s.id === id; });
        base[ix] = svc;
        issues.push({ level: 'ok', text: 'تم تحديث خدمة موجودة: "' + (titleAr || titleEn) + '" (' + id + ')' });
      } else {
        base.push(svc);
        baseIndex[id] = true;
      }
    });

    var added = mode === 'merge'
      ? base.length - builtin.length
      : base.filter(function (s) { return !baseIndex[s.id] || true; }).length;

    return {
      services: base,
      issues: issues,
      added: Math.max(0, added),
      updated: issues.filter(function (i) { return i.level === 'ok'; }).length
    };
  }

  /* ---------- توليد كود services.js ---------- */
  function generateCode(services, cats) {
    var d = new Date();
    var stamp = d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    var json = function (o) { return JSON.stringify(o, null, 2); };
    return '/* ============================================================\n'
      + '   MTN Syria - كتيب الخدمات التدريبي\n'
      + '   ⚠ هذا الملف مُولّد تلقائياً بواسطة أداة تحويل الإكسل\n'
      + '   تاريخ التوليد: ' + stamp + '\n'
      + '   لا تعدّله يدوياً — عدّل الملف من الإكسل ثم ولّد من جديد.\n'
      + '   ============================================================ */\n\n'
      + 'const SERVICES_DATA = ' + json(services) + ';\n\n'
      + '/* الفئات (مولّدة تلقائياً) */\n'
      + 'const CATEGORIES = ' + json(cats) + ';';
  }

  /* ---------- توليد الحزمة المجزأة data/services/ ---------- */
  function generateSplitPackage(services, cats) {
    var json = function (o) { return JSON.stringify(o, null, 2); };
    var files = {};
    var list = services.map(function (s) { return s.id + '.js'; }).sort();
    files['index.js'] =
      '/* ============================================================\n' +
      '   فهرس الخدمات — يُعرّف التصنيفات ويحمّل ملفات كل خدمة منفصلة.\n' +
      '   كل ملف service/<id>.js يُضيف خدمته إلى SERVICES_DATA.\n' +
      '   ============================================================ */\n\n' +
      'var SERVICES_DATA = [];\n\n' +
      'var SERVICE_FILES = ' + json(list) + ';\n\n' +
      'var CATEGORIES = ' + json(cats) + ';\n\n' +
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

    services.forEach(function (s) {
      files[s.id + '.js'] =
        '/* ============================================================\n' +
        '   الخدمة: ' + (s.title_ar || s.id) + ' / ' + (s.title_en || '') + '\n' +
        '   الملف منفصل لكل خدمة — أُنشئ تلقائياً.\n' +
        '   ============================================================ */\n\n' +
        '(function () {\n' +
        '  var root = (typeof window !== "undefined") ? window : globalThis;\n' +
        '  root.SERVICES_DATA = root.SERVICES_DATA || [];\n' +
        '  root.SERVICES_DATA.push(' + json(s) + ');\n' +
        '})();\n';
    });
    return files;
  }

  /* ---------- عملية كاملة: صفوف ← نتيجة ---------- */
  function processRows(rows, opts) {
    opts = opts || {};
    var mode = opts.mode || 'merge';
    var builtin = opts.builtin || [];
    var builtinCats = opts.builtinCats || [];

    if (!rows || !rows.length) {
      return { services: builtin, categories: builtinCats, issues: [{ level: 'error', text: 'لا توجد بيانات في الملف' }], added: 0, updated: 0 };
    }

    var headerRow = rows[0];
    var map = detectHeaders(headerRow);
    var hasHeaders = !map._fallback && Object.keys(map).length >= 8;
    var dataRows = hasHeaders ? rows.slice(1) : rows;

    var categories = buildCategories(dataRows, map, builtinCats);
    var res = buildServices(dataRows, map, { mode: mode, builtin: builtin, builtinCats: builtinCats });

    // تنبيه بالتصنيفات الجديدة
    categories.forEach(function (c) {
      if (!builtinCats.some(function (b) { return b.id === c.id; })) {
        res.issues.push({ level: 'warn', text: 'تصنيف جديد: "' + c.title_ar + '" (' + c.id + ')' });
      }
    });

    return {
      services: res.services,
      categories: categories,
      issues: res.issues,
      added: res.added,
      updated: res.updated,
      hasHeaders: hasHeaders,
      map: map
    };
  }

  /* ---------- واجهات إدخال ملفات ---------- */
  function processText(text, opts) {
    return processRows(parseCsv(text), opts);
  }

  function processWorkbook(wb, opts) {
    var first = wb && wb.SheetNames && wb.SheetNames.length ? wb.SheetNames[0] : null;
    if (!first) return processRows([], opts);
    var rows = wb._sheetToRows ? wb._sheetToRows : null;
    if (!rows) {
      // استخدم مباشرة API SheetJS إن وجد
      var sheet = wb.Sheets[first];
      if (typeof XLSX !== 'undefined' && XLSX.utils) {
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      } else {
        return processRows([], opts);
      }
    }
    return processRows(rows, opts);
  }

  global.SpreadsheetImport = {
    norm: norm,
    parseCsv: parseCsv,
    detectHeaders: detectHeaders,
    splitSteps: splitSteps,
    slugify: slugify,
    buildCategories: buildCategories,
    buildServices: buildServices,
    generateCode: generateCode,
    generateSplitPackage: generateSplitPackage,
    processRows: processRows,
    processText: processText,
    processWorkbook: processWorkbook,
    FIELDS: FIELDS,
    FIELDS_ORDER: FIELDS_ORDER
  };
})(typeof window !== 'undefined' ? window : this);