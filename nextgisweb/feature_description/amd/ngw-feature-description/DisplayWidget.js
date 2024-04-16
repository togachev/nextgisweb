define([
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/pyramid/icon",
], function (declare, i18n, DisplayWidget, icon) {
    return declare(DisplayWidget, {
        title: icon.html({ glyph: "description" }),

        renderValue: function (value) {
            this.domNode.innerHTML = value;
            return !!value;
        },
    });
});
