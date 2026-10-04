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
  "suspend.js",
  "shabab-line.js",
  "call-screening.js",
  "seconds-line.js",
  "باقات-الطلاب-والقطاع-العام-والصحفيين.js",
  "special-needs-bundles-باقات-ذوي-الهمم.js",
  "deaf-and-dumbs.js",
  "new-permanent-plans-for-prepaid-lines-الخطط-الجديدة-الدائمة-للخطوط-المسبقة-الدفع.js",
  "new-permanent-plans-for-postpaid-lines-الخطط-الجديدة-الدائمة-للخطوط-اللاحقة-الدفع.js",
  "new-data-bundles-social-hourly-for-prepaid-lines-segments.js",
  "الفاتورة-التفصيلية-الدائمة-أو-المؤقتة.js",
  "كشف-الفاتورة.js",
  "تأمين-مكالمات.js",
  "تقسيط-الفواتير.js",
  "الاستعلام-عن-الفواتير.js",
  "international-accesspreالصفر-الدوليللمسبق-الدفع.js",
  "international-roaming-pre-تجوال-دولي-مسبق.js",
  "data-roaming-تجوال-الانترنت-للمسبق.js",
  "zone-roaming-التجوال-الإقليمي.js",
  "international-roaming.js",
  "international-accessالصفر-الدوليللاحق-الدفع.js",
  "national-roamingالتجوال-المحلي.js",
  "sms-roaming-تجوال-الرسائل.js",
  "gprs-roamingتجوال-الإنترنت.js",
  "حاكيني.js",
  "تحويل الليرات.js",
  "New Gifting bundles for prepaid.js",
  "Tekram.js",
  "RBT.js",
  "تغيير-البطاقة-لاحقة-الدفع-والاحق.js",
  "طلب-تفويض.js",
  "طلب-تغيير-معلومات.js",
  "تنظيم-عقد-جديد-للخط-اللاحق-الدفع-والمسبق.js",
  "إيقاف-الخط.js",
  "تحويل-الخط-اللاحق-الدفع-إلى-مسبق-الدفع.js",
  "تغيير-الرقم.js",
  "التنازل-عن-خط-لاحق-الدفع.js",
  "الإيقاف-المؤقت-للخط.js",
  "المجموعات-المغلقة-المطورة.js",
  "cash-mobile-service.js",
  "fleet-management.js",
  "hybrid-billing.js",
  "adsl.js",
];

var CATEGORIES = [
  {
    "id": "Prepaid",
    "icon": "📱",
    "title_ar": "Prepaid",
    "title_en": "Prepaid"
  },
    {
    "id": "Postpaid",
    "icon": "📱",
    "title_ar": "Postpaid",
    "title_en": "postpaid"
  },
  {
    "id": "Entertement",
    "icon": "⏳",
    "title_ar": "Entertement",
    "title_en": "Entertement"
  },
  {
    "id": "Bundles",
    "icon": "🔢",
    "title_ar": "Bundles",
    "title_en": "Bundles"
  },
  {
    "id": "Cash Mobile",
    "icon": "🔐",
    "title_ar": "Cash Mobile",
    "title_en": "Cash Mobile"
  },
  {
    "id": "Adsl",
    "icon": "🎁",
    "title_ar": "Adsl",
    "title_en": "Adsl"
  },
  {
    "id": "Services",
    "icon": "📞",
    "title_ar": "Services",
    "title_en": "Services"
  }
  ,
  {
    "id": "Rooming",
    "icon": "🌐",
    "title_ar": "Rooming",
    "title_en": "Rooming"
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
