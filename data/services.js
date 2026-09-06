/* ============================================================
   MTN Syria - كتيب الخدمات التدريبي
   ============================================================
   لإضافة خدمة جديدة: انسخ الكائن التالي وعدّل محتواه
   ملاحظة: إذا لم يكن للخدمة فيديو بعد، اكفل قيمة video_url
   على أن تكون "" (فارغة) وسيُخفى قسم الفيديو تلقائياً.

   أمثلة على video_url المقبولة:
   - يوتيوب:  "https://www.youtube.com/watch?v=VIDEO_ID"
   - يوتيوب:  "https://youtu.be/VIDEO_ID"
   - درايف:   "https://drive.google.com/file/d/FILE_ID/view"
   - ملف محلي: "assets/videos/service-name.mp4"

   {
     id: "معرّف-فريد",
     category: "معرّف-التصنيف",
     icon: "emoji أو تعبير",
     title_ar: "العنوان بالعربية",
     title_en: "English Title",
     summary_ar: "ملخص قصير بالعربية (سطر واحد)",
     summary_en: "Short English summary",
     description_ar: "الشرح التفصيلي بالعربية. يمكنك وضع أكثر من فقرة
                      بفواصل الأسطر، وسيتم عرضها كفقرات.",
     description_en: "Detailed English description.",
     steps_ar: ["خطوة 1", "خطوة 2", "خطوة 3"],
     steps_en: ["Step 1", "Step 2", "Step 3"],
     video_url: "", // رابط الفيديو أو فارغ
     time_ar: "الزمن المتوقع للتنفيذ" // مثال: "5 دقائق" أو ""
   }
   ============================================================ */

const SERVICES_DATA = [
  /* ---------------------- قالب خدمة جاهزة ---------------------- */
  {
    id: "manual",
    category: "c-guidance",
    icon: "📝",
    title_ar: "دليل استخدام الكتيب",
    title_en: "Manual - How to use this guide",
    summary_ar: "كل ما تحتاج معرفته للتنقل بين الخدمات ومشاهدة الفيديوهات.",
    summary_en: "Everything you need to know to navigate services and watch videos.",
    description_ar: `مرحباً بك في كتيب خدمات MTN Syria التدريبي.
هذا الكتيب مخصص للمتدربين الجدد لتعريفهم بجميع الخدمات المتوفرة في الشركة، بطريقة مبسطة تجمع بين الشرح النصي والفيديوهات التوضيحية.

يمكنك التنقل بين الخدمات من القائمة الجانبية أو باستخدام البحث.
لكل خدمة صفحة خاصة تحتوي على: الشرح التفصيلي، خطوات التنفيذ، وفيديو توضيحي.
لحفظ تقدمك التعلمي، اضغط زر "تمت المشاهدة" في صفحة كل خدمة.`,
    description_en: `Welcome to the MTN Syria training guide.
This guide is designed for new trainees to introduce all services available at the company, in a simplified way combining text explanations and illustrative videos.

You can navigate between services from the sidebar or use the search.
Each service has a dedicated page containing: detailed explanation, execution steps, and an explanatory video.
To save your learning progress, press the "Mark as watched" button on each service page.`,
    steps_ar: [
      "تصفح الخدمات من الصفحة الرئيسية أو الشريط الجانبي",
      "افتح صفحة أي خدمة بالضغط على بطاقتها",
      "اقرأ الشرح التفصيلي وشاهد الفيديو التوضيحي",
      "اضغط زر «تمت المشاهدة» لتتبع تقدمك"
    ],
    steps_en: [
      "Browse services from the home page or sidebar",
      "Open any service page by clicking its card",
      "Read the detailed explanation and watch the video",
      "Press «Mark as watched» to track your progress"
    ],
    video_url: "https://www.youtube.com/watch?v=ZC20i5dZUgQ&list=RDZC20i5dZUgQ&start_radio=1",
    time_ar: "قراءة سريعة"
  },

  /* ---------------------- قالب خدمات خطوط الجوال ---------------------- */

  {
    id: "new-line",
    category: "c-mobile",
    icon: "📱",
    title_ar: "إصدار خط جديد",
    title_en: "New Line Activation",
    summary_ar: "شرح إجراءات إصدار خط جوال جديد لمشترك جديد أو لترقية خط موجود.",
    summary_en: "Procedures for activating a new mobile line for a new subscriber or upgrading an existing line.",
    description_ar: `شرح طريقة إصدار خط جوال جديد.
تتطلب بعض خدمات إصدار الخطوط اتباع إجراءات التحقق من الهوية (الرابط والمحوّل) للحفاظ على التزام الشركة بالقوانين والأنظمة.

يقوم الموظف بتسجيل بيانات المشترك في نظام الجوال، ثم يختار الباقة المناسبة بناءً على رغبة المشترك، ويُفعّل الخط خلال دقائق.`,
    description_en: `How to activate a new mobile line.
Some line issuance services require identity verification procedures (Link and Converter) to keep the company compliant with laws and regulations.

The employee registers the subscriber data in the mobile system, then selects the suitable package based on the subscriber's preference, and activates the line within minutes.`,
    steps_ar: [
      "استلام بيانات المشترك وبطاقة الهوية",
      "التحقق من هوية المشترك (الرابط والمحوّل)",
      "تسجيل البيانات في نظام الجوال",
      "اختيار الباقة المناسبة",
      "تفعيل الخط وتسليم الشريحة للمشترك"
    ],
    steps_en: [
      "Receive subscriber data and ID card",
      "Verify subscriber identity (Link and Converter)",
      "Register data in the mobile system",
      "Select the appropriate package",
      "Activate the line and hand over the SIM to the subscriber"
    ],
    video_url: "",
    time_ar: "10 دقائق"
  },

  {
    id: "sim-replacement",
    category: "c-mobile",
    icon: "💳",
    title_ar: "استبدال شريحة SIM",
    title_en: "SIM Replacement",
    summary_ar: "إجراءات استبدال الشريحة التالفة أو المفقودة دون تغيير الرقم.",
    summary_en: "Procedures for replacing a damaged or lost SIM without changing the number.",
    description_ar: `خدمة استبدال شريحة إس آي إم تالفة أو ضائعة مع الحفاظ على نفس الرقم.
يتم التحقق من هوية صاحب الرقم قبل إصدار الشريحة البديلة لضمان أمان الحساب.`,
    description_en: `SIM replacement service for damaged or lost SIMs while keeping the same number.
The owner identity is verified before issuing the replacement SIM to ensure account security.`,
    steps_ar: [
      "التحقق من هوية المشترك صاحب الرقم",
      "تأكيد رقم الخط المراد الاستبدال",
      "إصدار شريحة جديدة بنفس الرقم",
      "تفعيل الشريحة الجديدة"
    ],
    steps_en: [
      "Verify the identity of the number owner",
      "Confirm the line number to be replaced",
      "Issue a new SIM with the same number",
      "Activate the new SIM"
    ],
    video_url: "",
    time_ar: "5 دقائق"
  },

  /* ---------------------- قالب خدمات الإنترنت ---------------------- */

  {
    id: "internet-setup",
    category: "c-internet",
    icon: "🌐",
    title_ar: "إعداد خدمة الإنترنت المنزلي",
    title_en: "Home Internet Setup",
    summary_ar: "خطوات تجهيز وتفعيل خدمة الإنترنت المنزلي (FTTH أو الجيل الرابع).",
    summary_en: "Steps for preparing and activating home internet service (FTTH or 4G).",
    description_ar: `خدمة تجهيز الإنترنت المنزلي للمشتركين الجدد.
تقدم مياما خيارات متعددة تشمل الألياف الضوئية (FTTH) وأجهزة الجيل الرابع.

يتم التحقق من التغطية في المنطقة ثم إرسال طلب التجهيز للفريق الفني الذي يقوم بالتركيب والتفعيل.`,
    description_en: `Home internet setup service for new subscribers.
MTN offers multiple options including fiber optics (FTTH) and 4G devices.

Coverage is verified for the area, then the setup request is sent to the technical team for installation and activation.`,
    steps_ar: [
      "التحقق من تغطية منطقة المشترك",
      "اختيار نوع الخدمة المناسب (ألياف أو جيل رابع)",
      "تسجيل الطلب في النظام",
      "إحالة الطلب للفريق الفني",
      "متابعة التركيب حتى التفعيل"
    ],
    steps_en: [
      "Verify subscriber area coverage",
      "Choose the appropriate service type (fiber or 4G)",
      "Register the request in the system",
      "Refer the request to the technical team",
      "Follow up installation until activation"
    ],
    video_url: "",
    time_ar: "15 دقيقة"
  },

  /* ---------------------- قالب خدمات الفوترة ---------------------- */

  {
    id: "invoice-inquiry",
    category: "c-billing",
    icon: "🧾",
    title_ar: "الاستعلام عن الفاتورة",
    title_en: "Invoice Inquiry",
    summary_ar: "طريقة عرض الفاتورة الحالية وتاريخ الفواتير السابقة للمشترك.",
    summary_en: "How to view the current invoice and the subscriber's historical invoices.",
    description_ar: `خدمة تسمح للمشترك بالاستعلام عن الفاتورة الشهرية الحالية والفواتير السابقة.
يمكن عرض تفاصيل الفاتورة من النظام أو إرسال نسخة للمشترك عبر البريد الإلكتروني.`,
    description_en: `Service that allows subscribers to inquire about the current monthly invoice and previous invoices.
Invoice details can be displayed from the system or sent to the subscriber via email.`,
    steps_ar: [
      "إدخال رقم المشترك",
      "عرض الفاتورة الحالية وتفاصيلها",
      "الاطلاع على الفواتير السابقة عند الحاجة",
      "إرسال نسخة إلكترونية للمشترك إذا طلبها"
    ],
    steps_en: [
      "Enter subscriber number",
      "View current invoice and its details",
      "Browse previous invoices if needed",
      "Send an electronic copy to the subscriber if requested"
    ],
    video_url: "",
    time_ar: "3 دقائق"
  },

  {
    id: "recharge",
    category: "c-billing",
    icon: "⚡",
    title_ar: "الشحن والرفد (Pay - Recharge)",
    title_en: "Recharge (Pay - Recharge)",
    summary_ar: "شرح خدمة رفد الرصيد للمشتركين والحسابات المؤسسية.",
    summary_en: "Explanation of the pay & recharge service for subscribers and corporate accounts.",
    description_ar: `خدمة الشحن والرفد تتيح للمشترك أو لصاحب الحساب المؤسسي إضافة رصيد إلى الخط.
تتم عبر بطاقات الشحن أو الأنظمة الإلكترونية، ويتمتع المشترك برصيد فوري فور اكتمال العملية.`,
    description_en: `Recharge service allows subscribers or corporate account owners to add credit to the line.
It is done via recharge cards or electronic systems, and the subscriber receives instant credit once the process is complete.`,
    steps_ar: [
      "تأكيد رقم المشترك أو الحساب",
      "إدخال قيمة الرفد",
      "تسجيل العملية في النظام",
      "تأكيد وصول الرصيد للمشترك"
    ],
    steps_en: [
      "Confirm subscriber number or account",
      "Enter recharge value",
      "Record the transaction in the system",
      "Confirm credit reaches the subscriber"
    ],
    video_url: "",
    time_ar: "2 دقائق"
  },

  /* ---------------------- قالب خدمات الشركات ---------------------- */

  {
    id: "corporate-contract",
    category: "c-corporate",
    icon: "🏢",
    title_ar: "توقيع عقد خدمات الشركات",
    title_en: "Corporate Services Contract",
    summary_ar: "إجراءات توقيع اتفاقية خدمات الجوال لجهة مؤسسية كاملة.",
    summary_en: "Procedures for signing a mobile services agreement for an entire institution.",
    description_ar: `الاتفاقيات المؤسسية تتيح للشركات والمؤسسات تزويد موظفيها بخطوط جوال ضمن باقة موحدة وفاتورة واحدة.
يتضمن الإجراء اتفاق الأطراف على الشروط ثم إصدار البطاقات المؤسسية وتفعيل خدمة إدارة الحساب.`,
    description_en: `Corporate agreements allow companies and institutions to provide their employees with mobile lines within a unified package and a single invoice.
The procedure includes agreeing on terms, then issuing corporate lines and activating account management services.`,
    steps_ar: [
      "مناقشة احتياجات الجهة المؤسسية",
      "اتفاق الشروط والباقات",
      "توقيع العقد الرسمي",
      "تفعيل الخطوط المؤسسية",
      "تسليم بيانات إدارة الحساب"
    ],
    steps_en: [
      "Discuss the institution's needs",
      "Agree on terms and packages",
      "Sign the official contract",
      "Activate corporate lines",
      "Deliver account management credentials"
    ],
    video_url: "",
    time_ar: "30 دقيقة"
  },

  /* ---------------------- قالب خدمات إدارة الحساب ---------------------- */

  {
    id: "account-app",
    category: "c-account",
    icon: "📲",
    title_ar: "تطبيق My MTN وإدارة الحساب",
    title_en: "My MTN App & Account Management",
    summary_ar: "كيف نوجّه المشتركين إلى تطبيق My MTN لإدارة خدماتهم ذاتياً.",
    summary_en: "How to guide subscribers to the My MTN app to manage their services self-service.",
    description_ar: `تطبيق My MTN هو القناة الرقمية التي تتيح للمشترك إدارة خدمات الخط ذاتياً: تفعيل الباقات، رفد الرصيد، الاستعلام عن الفواتير، والتحكم بالخدمات.
يجدر بتوجيه المشتركين المتسائلين عن هذه الخدمات نحو التطبيق.`,
    description_en: `My MTN app is the digital channel that allows subscribers to manage their line services self-service: activating packages, recharging, invoice inquiry, and controlling services.
Customers asking about these services should be guided towards the app.`,
    steps_ar: [
      "توجيه المشترك لتحميل التطبيق من المتجر الرسمي",
      "مساعدة المشترك على إنشاء الحساب أو الدخول",
      "شرح الخدمات المتاحة داخل التطبيق",
      "التأكد من نجاح العملية المطلوبة"
    ],
    steps_en: [
      "Guide the subscriber to download the app from the official store",
      "Help the subscriber create an account or sign in",
      "Explain the services available inside the app",
      "Confirm the required process succeeded"
    ],
    video_url: "",
    time_ar: "5 دقائق"
  }
];

/* ============================================================
   التصنيفات (الفئات)
   أضف أو عدّل الفئات حسب ما تحتاجه في شركتكم.
   لاحظ أن category في كل خدمة يجب أن يطابق id الخاص بالفئة.
   ============================================================ */
const CATEGORIES = [
  { id: "c-guidance", icon: "📖", title_ar: "التعريف بالكتيب", title_en: "Guide Intro" },
  { id: "c-mobile", icon: "📱", title_ar: "خطوط الجوال", title_en: "Mobile Lines" },
  { id: "c-internet", icon: "🌐", title_ar: "خدمات الإنترنت", title_en: "Internet Services" },
  { id: "c-billing", icon: "🧾", title_ar: "الفوترة والشحن", title_en: "Billing & Recharge" },
  { id: "c-corporate", icon: "🏢", title_ar: "خدمات الشركات", title_en: "Corporate Services" },
  { id: "c-account", icon: "📲", title_ar: "إدارة الحساب", title_en: "Account Management" }
];