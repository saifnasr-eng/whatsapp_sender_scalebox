{
    'name': 'WhatsApp Sender - Scalebox',
    'version': '18.0.1.0.1',
    'category': 'Sales/CRM',
    'summary': 'Send invoices, sales orders, purchase orders, quotations, RFQs and POS receipts via WhatsApp as real file attachments',
    'description': """
WhatsApp Sender - Scalebox
============================

Adds a "Send via WhatsApp" button to:

* The Point of Sale Receipt Screen (after payment).
* The Customer Invoice form (next to Print).
* The Quotation / Sales Order form (next to Send by Email).
* The Request for Quotation / Purchase Order form (next to Send by Email).

Documents (Invoice, Sales Order, Purchase Order): generates the standard
Odoo PDF report for the document and shares it as a real file attachment
using the browser's native Web Share API (same result as opening a PDF on
your phone and tapping Share > WhatsApp). No public link, no attachment URL
is ever sent -- the user picks the WhatsApp contact themselves from the
native share sheet.

POS Receipt: shares a JPEG snapshot of the receipt exactly as displayed on
screen, using the same rendering Odoo itself uses for "Send Receipt" by
email/SMS. This guarantees the shared receipt is pixel-identical to the
official one, including any localization additions such as a ZATCA QR
code, VAT breakdown, etc.

If the device/browser does not support sharing files (mostly desktop
Linux browsers), the file is downloaded automatically instead, so the user
can attach it to WhatsApp manually.

This module does not modify any core Odoo file: it only uses view
inheritance (XML) and JS patching (@web/core/utils/patch), as recommended
for Odoo 18 Community development.

Developed by Scalebox for Digital Services -- https://www.scale.scbox.pro
""",
    'author': 'Scalebox for Digital Services',
    'website': 'https://www.scale.scbox.pro',
    'license': 'OPL-1',
    'price': 50.0,
    'currency': 'USD',
    'support': 'saifnasr100.sn@gmail.com',
    'depends': [
        'point_of_sale',
        'account',
        'sale',
        'purchase',
    ],
    'data': [
        'views/account_move_views.xml',
        'views/sale_order_views.xml',
        'views/purchase_order_views.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'whatsapp_sender_scalebox/static/src/js/whatsapp_share_utils.js',
            'whatsapp_sender_scalebox/static/src/js/pos_whatsapp_button.js',
            'whatsapp_sender_scalebox/static/src/xml/pos_whatsapp_button.xml',
        ],
        'web.assets_backend': [
            'whatsapp_sender_scalebox/static/src/js/whatsapp_share_utils.js',
            'whatsapp_sender_scalebox/static/src/js/whatsapp_share_widget.js',
            'whatsapp_sender_scalebox/static/src/xml/whatsapp_share_widget.xml',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}
