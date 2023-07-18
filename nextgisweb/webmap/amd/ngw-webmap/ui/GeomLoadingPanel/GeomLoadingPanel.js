define([
    'dojo/_base/declare', 'ngw-pyramid/dynamic-panel/DynamicPanel',
    'dijit/layout/BorderContainer',
    "@nextgisweb/gui/react-app",
    "@nextgisweb/webmap/geom-loading",
], function (
    declare, DynamicPanel,
    BorderContainer,
    reactApp,
    GeomLoadingComp
) {
    return declare([DynamicPanel, BorderContainer], {

        constructor: function (options) {
            declare.safeMixin(this, options);
            this.makeComp = (contentNode, options) => {
                reactApp.default(
                    GeomLoadingComp.default,
                    {
                        display: options.display,
                    },
                    contentNode
                );
            };
        },
        
        postCreate: function(){
            this.inherited(arguments);
        }
    });
});

