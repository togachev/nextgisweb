define([
    "dojo/_base/declare",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/resource/description",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/pyramid/icon",
], function (declare, reactApp, DescComp, { gettext }, DisplayWidget, icon) {
    return declare(DisplayWidget, {
        title: `<div class="custom-popup-button" title="${gettext("Description")}">` + icon.html({ glyph: "description" }) + `</div>`,

        renderValue: function (value) {
            if (!value) {
                return false;
            }

            reactApp.default(
                DescComp.default,
                {
                    display: this.display,
                    content: value,
                    type: "feature-obj",
                },
                this.domNode
            );
        },
    });
});
