define([
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/webmap/map-desc",
], function (
    declare,
    i18n,
    DisplayWidget,
    reactApp,
    MapDescComp
) {
    return declare(DisplayWidget, {
        title: i18n.gettext("Description"),

        renderValue: function (value) {
            if (!value) {return !!value;}
            reactApp.default(
                MapDescComp.default,
                {
                    description: value,
                    display: this.display,
                },
            this.domNode
            );
        }
    });
});