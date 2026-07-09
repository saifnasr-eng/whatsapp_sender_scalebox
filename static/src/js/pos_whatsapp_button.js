/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { useTrackedAsync } from "@point_of_sale/app/utils/hooks";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { _t } from "@web/core/l10n/translation";
import { shareWhatsappFile } from "@whatsapp_sender_scalebox/js/whatsapp_share_utils";

/**
 * Patches the POS ReceiptScreen (odoo core) to add a "Send via WhatsApp"
 * action, without touching any core file.
 *
 * The shared file is a JPEG snapshot of the receipt exactly as rendered on
 * screen (same OrderReceipt component and same this.generateTicketImage()
 * helper Odoo itself uses for "Send Receipt" by email/SMS). This guarantees
 * the shared receipt is pixel-identical to what is printed/displayed,
 * including any localization additions such as a ZATCA QR code, VAT
 * details, etc. -- instead of re-generating a separate PDF that could differ
 * from the official receipt layout.
 */
patch(ReceiptScreen.prototype, {
    setup() {
        super.setup(...arguments);
        this.doWhatsappShare = useTrackedAsync(() => this._shareReceiptOnWhatsapp());
    },

    async _shareReceiptOnWhatsapp() {
        const order = this.currentOrder;

        let ticketImageBase64;
        try {
            // Defined by core ReceiptScreen; returns a raw base64 JPEG
            // string (no data-uri prefix) of the receipt as displayed.
            ticketImageBase64 = await this.generateTicketImage();
        } catch (error) {
            console.error("WhatsApp Sender - Scalebox (POS): failed to generate the receipt image.", error);
            this.dialog.add(ConfirmationDialog, {
                title: _t("Could not generate the receipt"),
                body:
                    error?.message ||
                    _t("An unknown error occurred while generating the receipt image."),
            });
            return;
        }

        const reference = (order.pos_reference || order.name || "Receipt").toString();
        const filename = reference.replace(/[/\\]/g, "_").trim() + ".jpg";

        let shareResult;
        try {
            shareResult = await shareWhatsappFile(ticketImageBase64, filename, "image/jpeg");
        } catch (error) {
            console.error("WhatsApp Sender - Scalebox (POS): failed to share/download the receipt.", error);
            this.notification.add(
                _t("Could not share or download the receipt. See the browser console for details."),
                { type: "danger" }
            );
            return;
        }

        if (shareResult.downloaded) {
            const message = shareResult.insecureContext
                ? _t(
                      "Direct sharing requires HTTPS. The receipt was downloaded instead — please attach it manually in WhatsApp."
                  )
                : _t("The receipt was downloaded. Open WhatsApp and attach the file manually.");
            this.notification.add(message, { type: "warning" });
        }
    },
});
