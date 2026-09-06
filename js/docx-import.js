/* DOCX import module — يستخرج خدمات من ملفات Word (.docx) المحفوظة كاملة بالصور */
(function () {
  'use strict';

  var NUMBERED = /^\s*[0-9٠-٩]{1,2}\s*[ًٌٍَُِّْ]*\s*[-.)–]\s*/;
  var METHOD_HEAD = /طريقة|خطوات|إجراءات|الخطوات|كيفية|التحويل|التسجيل/;
  var IMG_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp' };

  var FALLBACK_CATS = {
    'إلغاء الاشتراك بالخط': 'c-cancel',
    'الاشتراك بالخط': 'c-lines',
    'الوثائق المقبولة': 'c-lines',
    'حجز الرقم': 'c-lines',
    'خليك معنا': 'c-promo',
    'pick your number': 'c-number',
    'annual validity': 'c-validity',
    'صلاحية': 'c-validity',
    'puk': 'c-security',
    'security': 'c-security',
    'pin': 'c-security',
  };
  var ICONS = { 'c-lines': '📱', 'c-cancel': '🗑️', 'c-validity': '⏳', 'c-number': '🔢', 'c-security': '🔐', 'c-promo': '🎁', 'c-other': '📄' };

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/&nbsp;/g, ' ')
      .replace(/<w:tab\/>/g, ' ')
      .replace(/<w:br\/>/g, '\n')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/[\uF0A0\uF0B1\uF07F\uF0C4\uF0C9]/g, '› ')
      .replace(/[\uF0B7\uF0D8\uF06A\uF0A5\uF0A2]/g, '• ')
      .replace(/[\uF000-\uF0FF]/g, ' ')
      .replace(/\r?\n+/g, '\n')
      .replace(/[ \t\u00A0]+/g, ' ')
      .trim();
  }

  function textOf(p) {
    var s = '';
    var m;
    var re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g;
    while ((m = re.exec(p))) {
      if (m[1] != null) s += m[1];
      else s += m[0].indexOf('tab') >= 0 ? ' ' : '\n';
    }
    return clean(s);
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
    for (var k in FALLBACK_CATS) if (t.indexOf(k.toLowerCase()) >= 0) return FALLBACK_CATS[k];
    return 'c-lines';
  }

  function toDataUrl(buffer, fname) {
    var ext = (fname.split('.').pop() || '').toLowerCase();
    var mime = IMG_TYPES[ext] || 'image/png';
    var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    var chunks = [];
    var CHUNK = 0x8000;
    for (var i = 0; i < bytes.length; i += CHUNK) chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)));
    return 'data:' + mime + ';base64,' + btoa(chunks.join(''));
  }

  function splitBlocks(xml) {
    // نطاقات الجداول العليا
    var tblRanges = [];
    var m;
    var reTbl = /<w:tbl\b[\s\S]*?<\/w:tbl>/g;
    while ((m = reTbl.exec(xml))) tblRanges.push([m.index, m.index + m[0].length]);
    function insideTbl(i) { for (var t = 0; t < tblRanges.length; t++) if (i >= tblRanges[t][0] && i < tblRanges[t][1]) return true; return false; }

    var blocks = [];
    var reP = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
    while ((m = reP.exec(xml))) if (!insideTbl(m.index)) blocks.push({ start: m.index, kind: 'p', body: m[1] });
    var reT2 = /<w:tbl\b[^>]*>([\s\S]*?)<\/w:tbl>/g;
    var tm;
    while ((tm = reT2.exec(xml))) blocks.push({ start: tm.index, kind: 'tbl', body: tm[1] });
    blocks.sort(function (a, b) { return a.start - b.start; });
    return blocks;
  }

  function parseTable(body) {
    var rows = [];
    var tr, tc;
    var reTr = /<w:tr\b[\s\S]*?<\/w:tr>/g;
    while ((tr = reTr.exec(body))) {
      var cells = [];
      var reTc = /<w:tc\b[\s\S]*?<\/w:tc>/g;
      while ((tc = reTc.exec(tr[0]))) {
        var lines = [];
        var reP = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
        var pm;
        while ((pm = reP.exec(tc[0]))) {
          var pt = textOf(pm[1]).replace(/[ \t\u00A0]+/g, ' ').trim();
          if (pt && lines.indexOf(pt) < 0) lines.push(pt);
        }
        cells.push({ t: lines.join(' '), lines: lines });
      }
      if (cells.length) rows.push(cells);
    }
    return rows;
  }

  function listImages(body) {
    var ids = [];
    var m;
    var reB = /<a:blip[^>]*\br:embed="(rId\d+)"/g;
    while ((m = reB.exec(body))) ids.push(m[1]);
    var reV = /<v:imagedata[^>]*\br:id="(rId\d+)"/g;
    while ((m = reV.exec(body))) ids.push(m[1]);
    return ids;
  }

  function cleanStep(t) { return t.replace(NUMBERED, '').trim(); }

  function runBoldCounts(body) {
    var runs = 0, bold = 0;
    var m;
    var re = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
    while ((m = re.exec(body))) {
      runs++;
      if (/<w:rPr[\s\S]*?<w:b\b/.test(m[0])) bold++;
    }
    return { runs: runs, bold: bold };
  }

  // فقرة عنوان: قصيرة وكل تشغيلاتها غامقة
  function isHeadPara(body, txt) {
    if (!txt || String(txt).length > 95) return false;
    if (/^[“”«"‘’'–—]/.test(txt) || /^اضغط هنا/.test(txt)) return false;
    var b = runBoldCounts(body);
    if (!b.runs || b.bold !== b.runs) return false;
    if (/^\s*\d+\s*[-.)–]/.test(txt)) return /:\s*$/.test(txt);
    return /[\u0600-\u06FF\u0041-\u005A\u0061-\u007A]/.test(txt);
  }

  function extractService(zip, meta) {
    meta = meta || {};
    return Promise.all([
      zip.file('word/document.xml').async('string'),
      zip.file('word/_rels/document.xml.rels').async('string'),
    ]).then(function (res) {
      var xml = res[0], relsXml = res[1];
      var rels = {};
      var m;
      var reRel = /<Relationship[^>]*\bId="(rId\d+)"[^>]*\bTarget="([^"]+)"/g;
      while ((m = reRel.exec(relsXml))) rels[m[1]] = m[2];

      var blocks = splitBlocks(xml);
      var desc = [];
      var steps = [];
      var images = [];
      var tables = [];
      var heads = [];
      var missing = [];
      var inMethod = false;

      var promises = [];

      blocks.forEach(function (blk) {
        if (blk.kind === 'tbl') {
          var rows = parseTable(blk.body);
          if (!rows.length) return;
          // جدول بعمود واحد = قائمة تُعرض كفقرات
          var singleCol = rows.every(function (r) { return r.length === 1; });
          if (singleCol) {
            rows.forEach(function (r) {
              var ls = r[0].lines.length ? r[0].lines : [r[0].t];
              ls.forEach(function (ln) { if (ln) desc.push(ln); });
            });
            return;
          }
          tables.push({ after: Math.max(desc.length - 1, 0), rows: rows.map(function (r) { return r.map(function (c) { return c.t; }); }) });
          return;
        }
        var txt = textOf(blk.body);
        var ps = /<w:pStyle\s+w:val="([^"]+)"/.exec(blk.body);
        var isHeading = ps && /heading|Title|titre/i.test(ps[1]);
        var imgs = listImages(blk.body);

        if (txt) {
          desc.push(txt);
          if (isHeading || isHeadPara(blk.body, txt)) heads.push(desc.length - 1);
        }
        if (isHeading) {
          inMethod = METHOD_HEAD.test(txt);
        } else if (/^\s*\d+\s*[-.)–]/.test(txt) && inMethod) {
          steps.push(cleanStep(txt));
        }

        imgs.forEach(function (rid) {
          var target = rels[rid];
          if (!target) { missing.push(rid); return; }
          var full = 'word/' + target.replace(/^\//, '');
          var file = zip.file(full);
          if (!file) {
            // محاولة مباشرة باسم الملف
            file = zip.file(new RegExp(escapeRegExp(target.split('/').pop()) + '$'));
          }
          if (!file) { missing.push(target); return; }
          var idx = Math.max(desc.length - 1, 0);
          promises.push(file.async('arraybuffer').then(function (buf) {
            images.push({ after: idx, src: toDataUrl(buf, file.name), caption: '' });
          }));
        });
      });

      return Promise.all(promises).then(function () {
        if (steps.length === 0) {
          // fallback: أطول تسلسل مرقّم متتالٍ
          var runs = []; var cur = [];
          blocks.forEach(function (blk) {
            if (blk.kind !== 'p') { if (cur.length) { runs.push(cur); cur = []; } return; }
            var t = textOf(blk.body);
            if (/^\s*\d+\s*[-.)–]/.test(t)) cur.push(cleanStep(t));
            else if (cur.length) { runs.push(cur); cur = []; }
          });
          if (cur.length) runs.push(cur);
          var best = runs.reduce(function (a, b) { return (a && a.length >= b.length ? a : b); }, null);
          if (best) steps = best.slice(0, 40);
        }

        images.sort(function (a, b) { return a.after - b.after; });

        var title = meta.title_ar || meta.title || '';
        var lang = isArabic(desc.join('\n')) ? 'ar' : 'en';
        var summary = desc[0] || '';
        if (String(summary).length > 170) summary = summary.slice(0, 170) + '…';

        return {
          file: meta.file || '',
          lang: lang,
          id: meta.id || slugify(meta.title_ar || title),
          category: meta.category || detectCategory(title),
          icon: meta.icon || ICONS[detectCategory(title)] || '📄',
          title_ar: meta.title_ar || (lang === 'ar' ? title : ''),
          title_en: meta.title_en || (lang === 'en' ? title : ''),
          sourceTitle: title,
          summary_ar: lang === 'ar' ? summary : (meta.summary_ar || ''),
          summary_en: lang === 'en' ? summary : (meta.summary_en || summary),
          description_ar: lang === 'ar' ? desc.join('\n\n') : '',
          description_en: lang === 'en' ? desc.join('\n\n') : (meta.summary_en || '') + '(التفاصيل الكاملة منشورة بالعربية)',
          steps_ar: lang === 'ar' ? steps : [],
          steps_en: lang === 'en' ? steps : [],
          heads_ar: heads,
          video_url: meta.video_url || '',
          images_ar: images,
          tables_ar: tables,
          missing_images: missing.filter(function (v, i, a) { return a.indexOf(v) === i; }),
          time_ar: meta.time_ar || '',
          time_en: meta.time_en || '',
        };
      });
    });
  }

  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  window.DocxImport = {
    extractService: extractService,
    slugify: slugify,
    detectCategory: detectCategory,
    ICONS: ICONS,
    toDataUrl: toDataUrl,
  };
})();