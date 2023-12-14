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

        constructor: function (map, FilterByFieldLayerStyle) {
            this._map = map;
            this._zIndex = this._zIndex + map.layers.length;
            this._overlay = new VectorImage("FilterByFieldLayer", {
                title: "FilterByFieldLayer",
                style: FilterByFieldLayerStyle
                ? FilterByFieldLayerStyle
                : this._getDefaultStyle(),
            });
            this._overlay.olLayer.setZIndex(this._zIndex);
            this._source = this._overlay.olLayer.getSource();
            this._map.addLayer(this._overlay);
        },

        _getDefaultStyle: function () {
            var dataStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "rgba(255,255,0,0.5)",
                    width: 12
                }),
                fill: new ol.style.Fill({
                    color: "rgba(255,255,0,0.2)",
                    width: 12
                })
            });
        
            return dataStyle;
        }
        
    });
});
