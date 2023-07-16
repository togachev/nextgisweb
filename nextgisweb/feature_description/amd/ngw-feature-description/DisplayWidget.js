define([
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/feature_description/feature-desc",
], function (
    declare,
    i18n,
    DisplayWidget,
    reactApp,
    FeatureDescComp
) {
    return declare(DisplayWidget, {
        title: i18n.gettext("Description"),

        renderValue: function (value) {
            if (!value) {return !!value;}
            reactApp.default(
                FeatureDescComp.default,
                {
                    description: value,
                },
                this.domNode
            );
        }
    });
});