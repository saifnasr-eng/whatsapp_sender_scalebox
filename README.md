# WhatsApp Sender - Scalebox — Odoo 18 Community

تطوير: **Scalebox for Digital Services** — [www.scale.scbox.pro](https://www.scale.scbox.pro)

موديول يضيف زر **Send via WhatsApp** في:

1. شاشة الإيصال بعد الدفع في نقطة البيع (POS Receipt Screen).
2. نموذج فاتورة العميل (Customer Invoice)، بجانب Print.
3. نموذج عرض السعر / أمر البيع (Quotation / Sales Order)، بجانب Send by Email — نفس النموذج `sale.order` يغطي الحالتين (مسودة = عرض سعر، مؤكد = أمر بيع).
4. نموذج طلب عرض سعر / أمر الشراء (RFQ / Purchase Order)، بجانب Send by Email — نفس النموذج `purchase.order` يغطي الحالتين (مسودة = طلب عرض سعر، مؤكد = أمر شراء).

## آلية العمل

### المستندات (فاتورة العميل / أمر البيع / عرض السعر / أمر الشراء / طلب عرض السعر)

يولّد الموديول تقرير الـ PDF القياسي في Odoo لكل مستند (نفس التقرير الذي يظهر عند الضغط على Print في كل نموذج)، ثم يحوّله المتصفح إلى `File` ويستدعي `navigator.share({ files: [...] })` (Web Share API) — نفس نتيجة فتح PDF على الجوال ثم Share ← WhatsApp. المستخدم يختار جهة الاتصال بنفسه، ويُرسل الملف كمرفق حقيقي وليس رابطًا.

كل الأربعة أنواع (فاتورة، أمر بيع، عرض سعر، أمر شراء، طلب عرض سعر) تستخدم **نفس الآلية** (نفس الزر `whatsapp_share_widget` ونفس دالة `action_get_whatsapp_pdf` على كل موديل) — فقط تقرير الـ PDF المرجعي يختلف حسب نوع المستند.

### إيصال نقطة البيع (POS Receipt)

**لا يُبنى تقرير منفصل على السيرفر.** بدلًا من ذلك، يأخذ الموديول صورة (JPEG) من الإيصال **كما هو معروض بالضبط على الشاشة**، باستخدام نفس الآلية التي يستخدمها Odoo نفسه عند "إرسال الإيصال" بالإيميل/SMS (`ReceiptScreen.generateTicketImage()`). هذا يضمن أن الإيصال المُرسَل عبر واتساب **مطابق تمامًا** للإيصال الرسمي، شامل أي إضافات محلية مثل **رمز QR الخاص بهيئة الزكاة والضريبة والجمارك (ZATCA)**.

- إن لم يدعم المتصفح/النظام مشاركة الملفات (خصوصًا متصفحات Linux على سطح المكتب)، يتم تنزيل الملف تلقائيًا ليقوم المستخدم بإرفاقه يدويًا في واتساب.

## التثبيت

1. انسخ مجلد `whatsapp_sender_scalebox` إلى مجلد `addons` الخاص بسيرفر Odoo 18.
2. من إعدادات المطوّر: Update Apps List.
3. ابحث عن **WhatsApp Sender - Scalebox** وثبّته (يعتمد على `point_of_sale` و `account` و `sale` و `purchase`، وسيتم تثبيتهم تلقائيًا إن لم يكونوا مثبّتين).

## بنية الموديول

```
whatsapp_sender_scalebox/
├── __manifest__.py
├── models/
│   ├── account_move.py           # فاتورة العميل (account.account_invoices)
│   ├── sale_order.py             # عرض سعر / أمر بيع (sale.action_report_saleorder)
│   └── purchase_order.py         # طلب عرض سعر / أمر شراء (purchase.report_purchase_quotation)
├── views/
│   ├── account_move_views.xml    # الزر بجانب Print في الفاتورة
│   ├── sale_order_views.xml      # الزر بجانب Send by Email في sale.order
│   └── purchase_order_views.xml  # الزر بجانب Send by Email في purchase.order
└── static/src/
    ├── js/
    │   ├── whatsapp_share_utils.js   # منطق المشاركة/التنزيل المشترك (PDF أو صورة)
    │   ├── whatsapp_share_widget.js  # الويدجت العام لأي نموذج (فاتورة/بيع/شراء)
    │   └── pos_whatsapp_button.js    # patch على ReceiptScreen (يلتقط صورة الإيصال المعروض)
    └── xml/
        ├── whatsapp_share_widget.xml
        └── pos_whatsapp_button.xml   # t-inherit على قالب ReceiptScreen
```

الموديول لا يعدّل أي ملف أصلي من Odoo — فقط `view inheritance` (XML) و `patch()` من `@web/core/utils/patch` للجافاسكريبت.

## القيود المعروفة (Web Share API)

| المنصة | نتيجة "Send via WhatsApp" |
|---|---|
| Android (Chrome) | نافذة المشاركة الأصلية تفتح، والملف يُرسل مباشرة إلى واتساب |
| iPhone / iPad (Safari) | نافذة المشاركة الأصلية تفتح (يتطلب HTTPS) |
| Windows (Chrome/Edge) | يفتح نافذة مشاركة النظام إن كان واتساب مسجّلًا كمستقبل مشاركة؛ وإلا يتم تنزيل الملف تلقائيًا |
| Linux (Chrome/Firefox) | غالبًا لا يدعم المتصفح مشاركة الملفات على سطح المكتب؛ يتم تنزيل الملف تلقائيًا ليُرفق يدويًا |

هذا القيد ناتج عن قيود أمان المتصفحات نفسها، وليس قصورًا في الموديول.

## ملاحظة اختبار

تم بناء هذا الموديول بالاعتماد على كود Odoo 18 الرسمي من فرع `18.0` (تم التحقق من أسماء الأزرار والتقارير الفعلية في `sale`, `purchase`, `account`, `point_of_sale` من المصدر الرسمي)، لكن لم يتسنَّ تشغيله على قاعدة بيانات Odoo فعلية داخل هذه الجلسة. يُنصح بتثبيته أولًا على قاعدة بيانات تجريبية (Fresh Database) قبل استخدامه في بيئة حقيقية.

## استكشاف الأخطاء (Troubleshooting)

1. **افتح Developer Tools في المتصفح (F12) → تبويب Console** قبل الضغط على الزر — أي خطأ سيظهر كرسالة/Dialog داخل Odoo أو في الـ Console.
2. **تحقق من سجلات سيرفر Odoo** بعد الضغط على أي زر من أزرار الفاتورة/أمر البيع/أمر الشراء: أي فشل في توليد الـ PDF يُسجَّل بالتفصيل (`_logger.exception`) قبل ظهور رسالة الخطأ للمستخدم.
3. **HTTPS للموبايل**: `navigator.share` لا يعمل إلا على اتصال آمن (HTTPS أو localhost). الوصول عبر IP محلي بـ HTTP عادي سيجعل الموديول يُنزّل الملف تلقائيًا بدل المشاركة المباشرة، مع رسالة توضيحية.
4. **إيصال الـ POS**: يُشارَك كصورة JPEG من نفس ما هو معروض على الشاشة (وليس PDF منفصل)، لضمان مطابقته تمامًا لتصميمكم الرسمي شامل رمز QR الخاص بالزكاة.
5. **الإصدار `18.0.1.0.1`**: تم إصلاح خطأ ظهر عند التثبيت على سيرفركم (`TypeError: Many2many fields ... matched_payment_ids use the same table and columns`). السبب: النسخة الأولى كانت تستخدم نمط "mixin" مشترك (`_inherit = ['account.move', 'whatsapp.share.mixin']`) لتقليل تكرار الكود، وهذا تعارض مع تركيبة الموديولات المخصّصة على سيرفركم (يوجد لديكم موديول `simplify_access_management` يتدخل في عملية التثبيت). تم التراجع عن هذا النمط: كل موديل (`account.move`, `sale.order`, `purchase.order`) أصبح الآن يستخدم `_inherit` بسيط (نص عادي وليس قائمة)، بنفس الأسلوب الذي كان يعمل بامتياز في الموديول السابق.
