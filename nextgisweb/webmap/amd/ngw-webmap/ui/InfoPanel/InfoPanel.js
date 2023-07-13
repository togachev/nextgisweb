define([
    'dojo/_base/declare', 'ngw-pyramid/dynamic-panel/DynamicPanel',
    'dijit/layout/BorderContainer',
    "@nextgisweb/gui/react-app", "@nextgisweb/webmap/info-panel",
    "@nextgisweb/webmap/map-desc",
], function (
    declare, DynamicPanel,
    BorderContainer,
    reactApp, infoPanelComp,
    MapDescComp
) {
    return declare([DynamicPanel, BorderContainer], {

        constructor: function () {
            declare.safeMixin(this);

            this.makeComp = (contentNode) => {
                reactApp.default(
                    MapDescComp.default,
                    {
                        description: this.description,
                        widget: this,
                    },
                    contentNode
                );
            };
        },
        
        postCreate: function(){
            this.inherited(arguments);
        },

        zoomToFeature: function (resid, fid) {
            this.display
                .featureHighlighter
                .highlightFeatureById(fid, resid)
                .then(lang.hitch(this, function (feature) {
                    this.display.map.zoomToFeature(feature);
                }));
        }
    });
});

