define([
    "dojo/_base/declare",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/resource/description",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/pyramid/icon",
], function (declare, reactApp, DescComp, { gettext }, DisplayWidget, icon) {

    const title = !this.display ? gettext("Description") : "";

    return declare(DisplayWidget, {
        title: title,

        renderValue: function (value) {
            if (!value) {
                return false;
            }
            
            reactApp.default(
                DescComp.default,
                {
                    display: this.display,
                    content: value,
                },
                this.domNode
            );
        },
    });
});
