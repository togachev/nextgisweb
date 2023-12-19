define([
    "dojo/_base/declare",
    "ngw-webmap/ol/layer/VectorImage",
    "openlayers/ol",
], function (declare, VectorImage, ol) {
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
                style: FilterByDataLayerStyle
                ? FilterByDataLayerStyle
                : this._getDefaultStyle(),
            });
            this._overlay.olLayer.setZIndex(this._zIndex);
            this._source = this._overlay.olLayer.getSource();
            this._map.addLayer(this._overlay);
        },

        _getDefaultStyle: function () {
            var dataStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "rgba(255,172,0,0.2)",
                    width: 30
                }),
                fill: new ol.style.Fill({
                    color: "rgba(255,172,0,0.2)",
                    width: 30
                })
            });
        
            return dataStyle;
        }
        
    });
});
