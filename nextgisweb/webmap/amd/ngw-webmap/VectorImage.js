define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/request/xhr",
    "dojo/topic",
    "dojo/Deferred",
    "@nextgisweb/pyramid/api",
    "ngw-webmap/ol/layer/VectorImage",
    "openlayers/ol",
], function (declare, lang, xhr, topic, Deferred, api, VectorImage, ol) {
    return declare("ngw-webmap.VectorImage", [], {
        _map: null,
        _source: null,
        _overlay: null,
        _zIndex: 1000,

        constructor: function (map, FilterByDataLayerStyle) {
            this._map = map;
            this._zIndex = this._zIndex + map.layers.length;
            this._overlay = new VectorImage("FilterByDataLayer", {
                title: "FilterByDataLayer",
            });
            this._overlay.olLayer.setZIndex(this._zIndex);
            this._source = this._overlay.olLayer.getSource();
            this._map.addLayer(this._overlay);
        },

    });
});
