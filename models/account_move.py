# -*- coding: utf-8 -*-
import base64
import logging

from odoo import _, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class AccountMove(models.Model):
    _inherit = 'account.move'

    def action_get_whatsapp_pdf(self):
        """Return the standard invoice PDF (as base64) so it can be shared
        as a real file attachment via WhatsApp from the client side
        (Web Share API), instead of sending a download link.
        """
        self.ensure_one()

        try:
            if self.invoice_pdf_report_id:
                pdf_content = self.invoice_pdf_report_id.raw
            else:
                pdf_content, _report_type = self.env['ir.actions.report']._render_qweb_pdf(
                    'account.account_invoices', self.ids
                )
        except Exception:
            _logger.exception(
                "WhatsApp Sender - Scalebox: failed to generate the PDF for account.move %s", self.id
            )
            raise UserError(
                _("Could not generate the PDF for this invoice. Please check the Odoo server logs.")
            )

        filename = self._get_invoice_report_filename() or self.name or 'Invoice'
        filename = filename.replace('/', '_').strip()
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'

        return {
            'filename': filename,
            'pdf_base64': base64.b64encode(pdf_content).decode('ascii'),
        }
