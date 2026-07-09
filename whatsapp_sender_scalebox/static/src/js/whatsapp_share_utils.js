/** @odoo-module **/

/**
 * Shared helper used across the POS Receipt Screen, Customer Invoice,
 * Sales Order / Quotation, and Purchase Order / RFQ forms to share a file
 * (PDF document or JPEG receipt) via WhatsApp.
 *
 * It always shares/downloads the *actual file* (never a link or a
 * public URL):
 *  - When the browser/OS supports the Web Share API with files
 *    (navigator.share + navigator.canShare({files})), the native share
 *    sheet is opened with the file attached, exactly as if the user had
 *    opened it on their device and tapped Share > WhatsApp. The user
 *    then picks the WhatsApp contact themselves.
 *  - Otherwise (typically desktop Linux browsers, or browsers without
 *    Web Share API file support), the file is downloaded automatically so
 *    the user can attach it to WhatsApp manually. This is the best
 *    practical fallback allowed by browser security restrictions.
 */

function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const chunkSize = 512;
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
        const slice = byteCharacters.slice(offset, offset + chunkSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: contentType });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * @param {string} base64Content base64-encoded file content (no data-uri prefix)
 * @param {string} filename e.g. "INV_2024_00001.pdf", "S00042.pdf" or "Receipt_00042.jpg"
 * @param {string} [contentType="application/pdf"] MIME type, e.g. "application/pdf" or "image/jpeg"
 * @returns {Promise<{shared: boolean, downloaded?: boolean, cancelled?: boolean, insecureContext?: boolean}>}
 */
export async function shareWhatsappFile(base64Content, filename, contentType = "application/pdf") {
    const blob = base64ToBlob(base64Content, contentType);
    const file = new File([blob], filename, { type: contentType });

    // The Web Share API (and File-sharing in particular) is only exposed by
    // browsers in a secure context (HTTPS, or localhost). On a plain HTTP
    // LAN address (common for on-premise Odoo/POS setups), navigator.share
    // is simply undefined, especially on Android. Detect this explicitly so
    // the caller can tell the user *why* sharing isn't available instead of
    // silently doing nothing.
    const isSecureContext = typeof window === "undefined" || window.isSecureContext !== false;

    let canUseWebShare = false;
    if (isSecureContext && typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        try {
            canUseWebShare = navigator.canShare({ files: [file] });
        } catch (error) {
            // Some browsers throw instead of returning false for unsupported types.
            console.warn("WhatsApp Sender - Scalebox: navigator.canShare threw, falling back to download.", error);
            canUseWebShare = false;
        }
    }

    if (canUseWebShare) {
        try {
            await navigator.share({ files: [file], title: filename });
            return { shared: true };
        } catch (error) {
            if (error && error.name === "AbortError") {
                // user closed the native share sheet without picking anything
                return { shared: false, cancelled: true };
            }
            // Any other error: log it and fall back to download below.
            console.error("WhatsApp Sender - Scalebox: navigator.share failed, falling back to download.", error);
        }
    }

    downloadBlob(blob, filename);
    return { shared: false, downloaded: true, insecureContext: !isSecureContext };
}

/** Backwards-compatible alias for PDF-only callers. */
export async function shareWhatsappPdf(base64Pdf, filename) {
    return shareWhatsappFile(base64Pdf, filename, "application/pdf");
}
