/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardWidgetProps } from "@web/views/widgets/standard_widget_props";
import { Component, useState } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { shareWhatsappPdf } from "@whatsapp_sender_scalebox/js/whatsapp_share_utils";

/**
 * Generic form view widget adding a "Send via WhatsApp" button. It is
 * model-agnostic: it just calls "action_get_whatsapp_pdf" on whatever
 * record it is placed on (see models/whatsapp_share_mixin.py), so the same
 * widget is reused on the Customer Invoice, Sales Order / Quotation, and
 * Purchase Order / RFQ forms (see the views/ folder for where it's added).
 */
export class WhatsappShareWidget extends Component {
    static template = "whatsapp_sender_scalebox.WhatsappShareWidget";
    static props = { ...standardWidgetProps };

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.dialog = useService("dialog");
        this.state = useState({ loading: false });
    }

    async onClick() {
        if (this.state.loading) {
            return;
        }
        this.state.loading = true;
        try {
            const { record } = this.props;

            let result;
            try {
                result = await this.orm.call(record.resModel, "action_get_whatsapp_pdf", [
                    record.resId,
                ]);
            } catch (error) {
                console.error("WhatsApp Sender - Scalebox: failed to generate the PDF.", error);
                const debug = error?.data?.debug
                    ? String(error.data.debug).split("\n").slice(-6).join("\n")
                    : "";
                this.dialog.add(ConfirmationDialog, {
                    title: _t("Could not generate the PDF"),
                    body: [
                        error?.data?.message ||
                            error?.message ||
                            _t("An unknown error occurred while generating the PDF."),
                        debug,
                    ]
                        .filter(Boolean)
                        .join("\n\n"),
                });
                return;
            }

            let shareResult;
            try {
                shareResult = await shareWhatsappPdf(result.pdf_base64, result.filename);
            } catch (error) {
                console.error("WhatsApp Sender - Scalebox: failed to share/download the PDF.", error);
                this.notification.add(
                    _t("Could not share or download the PDF. See the browser console for details."),
                    { type: "danger" }
                );
                return;
            }

            if (shareResult.downloaded) {
                const message = shareResult.insecureContext
                    ? _t(
                          "Direct sharing requires HTTPS. The PDF was downloaded instead — please attach it manually in WhatsApp."
                      )
                    : _t("The PDF was downloaded. Open WhatsApp and attach the file manually.");
                this.notification.add(message, { type: "warning" });
            }
        } finally {
            this.state.loading = false;
        }
    }
}

export const whatsappShareWidget = {
    component: WhatsappShareWidget,
};

registry.category("view_widgets").add("whatsapp_share_widget", whatsappShareWidget);
