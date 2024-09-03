define([
    "dojo/_base/declare",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/resource/description",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/pyramid/icon",
], function (declare, reactApp, DescComp, { gettext }, DisplayWidget, icon) {
    return declare(DisplayWidget, {
        title: gettext("Description"),

        renderValue: function (value) {
            if (!value) {
                return false;
            }

            reactApp.default(
                DescComp.default,
                {
                    content: value,
                    type: "feature-obj",
                },
                this.domNode
            );
        },
    });
});
