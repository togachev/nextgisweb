define([
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/feature-attachment/attachment-table",
    "@nextgisweb/pyramid/icon",
], function (declare, { gettext }, DisplayWidget, reactApp, AttachmentTable, icon) {

    const title = !this.display ? gettext("Attachments") : "";

    return declare([DisplayWidget], {
        title: `<div class="custom-popup-button" title="${gettext("Attachments")}">` + icon.html({ glyph: "attach_file" }) + ` ${title}</div>`,

        renderValue: function (value) {
            if (!value) {
                return false;
            }
            reactApp.default(
                AttachmentTable.default,
                {
                    attachments: value,
                    featureId: this.featureId,
                    resourceId: this.resourceId,
                    isSmall: this.compact,
                },
                this.domNode
            );
        },
    });
});
