define([
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/feature-attachment/attachment-table",
    "@nextgisweb/pyramid/icon",
], function (declare, { gettext }, DisplayWidget, reactApp, AttachmentTable, icon) {
    return declare([DisplayWidget], {
        title: icon.html({ glyph: "attachment" }),

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
