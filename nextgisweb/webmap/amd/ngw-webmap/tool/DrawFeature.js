define([
    "dojo/_base/declare",
    "./Base",
    "openlayers/ol",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/webmap/draw-feature",
    "@nextgisweb/pyramid/i18n!",
    "@nextgisweb/pyramid/icon",
    "dojo/topic",
    "xstyle/css!./resources/Zoom.css",
], function (declare, Base, ol, reactApp, DrawFeatureComp, i18n, icon, topic) {
    return declare(Base, {
        DrawFeatureCompDomNode: undefined,
        customCssClass: "draw-feature-tool",

        constructor: function () {
            this.label = i18n.gettext("Show cursor coordinates / extent");
            this.customIcon =
                '<span class="ol-control__icon">' +
                icon.html({ glyph: "draw" }) +
                "</svg></span>";
        },

        activate: function () {
            if (!this.DrawFeatureCompDomNode) {
                const domNode = this.toolbarBtn.domNode;
                const newNode = document.createElement("div");
                newNode.classList.add("viewer-info");
                domNode.after(newNode);
                this.DrawFeatureCompDomNode = newNode;
            }
            this.makeComp(true);
        },

        deactivate: function () {
            this.makeComp(false);
        },

        makeComp: function (show) {
            const olMap = this.display.map.olMap;
            reactApp.default(
                DrawFeatureComp.default,
                {
                    topic,
                    show,
                    map: olMap,
                },
                this.DrawFeatureCompDomNode
            );
        },
    });
});
