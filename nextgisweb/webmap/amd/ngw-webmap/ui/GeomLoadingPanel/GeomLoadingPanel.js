define([
    'dojo/_base/declare',
    '@nextgisweb/pyramid/i18n!',
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    'ngw-pyramid/dynamic-panel/DynamicPanel',
    'dijit/layout/BorderContainer',
    "dojo/text!./GeomLoadingPanel.hbs",
    "xstyle/css!./GeomLoadingPanel.css"
], function (
    declare,
    i18n,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    DynamicPanel,
    BorderContainer,
    template
) {
    return declare([DynamicPanel, BorderContainer], {

        constructor: function (options) {
            declare.safeMixin(this,options);

            this.contentWidget = new (declare([BorderContainer, _TemplatedMixin, _WidgetsInTemplateMixin], {
                templateString: i18n.renderTemplate(template),
                region: 'top',
                gutters: false
            }));
        }
    });
});

