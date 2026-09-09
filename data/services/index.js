/* ============================================================
   فهرس الخدمات — يُعرّف التصنيفات ويحمّل ملفات كل خدمة منفصلة.
   كل ملف service/<id>.js يُضيف خدمته إلى SERVICES_DATA.
   أُنشئ تلقائياً بالاشتراك مع الملفات المنفصلة في هذا المجلد.
   ============================================================ */

var SERVICES_DATA = [];

var SERVICE_FILES = [
  "accepted-documents.js",
  "annual-validity.js",
  "cancel-postpaid.js",
  "cancel-prepaid.js",
  "khalik-manna.js",
  "pick-your-number.js",
  "puk-security-code.js",
  "reserve-number-sms.js",
  "subscribe-postpaid.js",
  "subscribe-prepaid.js",
  "E-Sim.js",
  "الرسائل-القصيرة.js",
  "الانتظار.js",
  "تحويل-المكالمات.js",
  "تسديد-الفواتير-عن-طريق-التحويل.js",
  "تعبئة-الرصيد-عبر-البنك.js",
  "خدمة-تحويل-الرصيد-عن-طريق-الموزعين.js",
  "خدمة-تحويل-الليرات-عن-طريق-المراكز.js",
  "مكالمة-متعددة-الأطراف.js",
  "سوبر-كليب-الخط-المسبق-الدفع.js",
  "سوبر-كليب-الخط-اللاحق-الدفع-.js",
  "barring-of-outgoing-calls.js",
  "dunning.js",
  "due-date.js",
  "bill-ceiling.js",
  "suspend.js"
];

var CATEGORIES = [
  {
    "id": "c-lines",
    "icon": "📱",
    "title_ar": "الخطوط والاشتراك",
    "title_en": "Lines & Subscriptions"
  },
    {
    "id": "c-cancel",
    "icon": "🗑️",
    "title_ar": "إلغاء الاشتراك",
    "title_en": "Cancellation"
  },
  {
    "id": "c-validity",
    "icon": "⏳",
    "title_ar": "صلاحية الخط",
    "title_en": "Line Validity"
  },
  {
    "id": "c-number",
    "icon": "🔢",
    "title_ar": "الأرقام",
    "title_en": "Numbers"
  },
  {
    "id": "c-security",
    "icon": "🔐",
    "title_ar": "الحماية والأمان",
    "title_en": "Security"
  },
  {
    "id": "c-promo",
    "icon": "🎁",
    "title_ar": "العروض",
    "title_en": "Offers"
  },
  {
    "id": "S-Services",
    "icon": "📞",
    "title_ar": "خدمات مخصصة",
    "title_en": "S-Services"
  }
];

/* تحميل ملفات الخدمات المنفصلة (يُحمَّل الموقع من file:// أو HTTP) */
(function () {
  var base = (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      var idx = src.indexOf('data/services/index.js');
      if (idx !== -1) return src.slice(0, idx + 'data/services/'.length);
    }
    return 'data/services/';
  })();
  SERVICE_FILES.forEach(function (f) {
    document.write('<script src="' + base + f + '"><\/script>');
  });
})();
