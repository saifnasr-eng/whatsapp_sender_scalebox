# -*- coding: utf-8 -*-
import base64
import logging

from odoo import _, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class PurchaseOrder(models.Model):
    """Covers both Requests for Quotation (RFQ) and confirmed Purchase
    Orders: they are the same 'purchase.order' model in Odoo, only the
    state field differs ('draft'/'sent'/'to approve' = RFQ, 'purchase'/
    'done' = Purchase Order), so a single button on this form serves both
    document types.
    """
    _inherit = 'purchase.order'

    def action_get_whatsapp_pdf(self):
        """Return the standard RFQ/purchase order PDF (as base64) so it
        can be shared as a real file attachment via WhatsApp from the
        client side (Web Share API), instead of sending a download link.
        """
        self.ensure_one()

        try:
            pdf_content, _report_type = self.env['ir.actions.report']._render_qweb_pdf(
                'purchase.report_purchase_quotation', self.ids
            )
        except Exception:
            _logger.exception(
                "WhatsApp Sender - Scalebox: failed to generate the PDF for purchase.order %s", self.id
            )
            raise UserError(
                _("Could not generate the PDF for this document. Please check the Odoo server logs.")
            )

        filename = self._get_report_base_filename() or self.name or 'Purchase Order'
        filename = filename.replace('/', '_').strip()
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'

        return {
            'filename': filename,
            'pdf_base64': base64.b64encode(pdf_content).decode('ascii'),
        }
