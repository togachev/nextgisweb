define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/request/xhr',
    'dojo/topic',
    'dojo/Deferred',
    '@nextgisweb/pyramid/api',
    'ngw-webmap/ol/layer/Vector',
    'openlayers/ol'
], function (
    declare,
    lang,
    xhr,
    topic,
    Deferred,
    api,
    Vector,
    ol
) {
    return declare('ngw-webmap.FeatureHighlighterDiagram', [], {
        _map: null,
        _source: null,
        _overlay: null,
        _wkt: new ol.format.WKT(),
        _zIndex: 1000,

        constructor: function (map, highlightDiagramStyle) {
            this._map = map;
            this._overlay = new Vector('highlightDiagram', {
                title: 'Highlight Diagram Overlay',
                style: highlightDiagramStyle ? highlightDiagramStyle : this._getDefaultStyle()
            });
            this._overlay.olLayer.setZIndex(this._zIndex);
            this._source = this._overlay.olLayer.getSource();
            this._source.wrapX_ = false;

            this._bindEvents();

            this._map.addLayer(this._overlay);
        },

        _getDefaultStyle: function () {
            var strokeStyle = new ol.style.Stroke({
                color: [255,155,0, 1],
                width: 2
            });

            var strokeStylePoint = new ol.style.Stroke({
                color: [255,155,255, 1],
                width: 1.5
            });

            return new ol.style.Style({
                stroke: strokeStyle,
                image: new ol.style.Circle({
                    stroke: strokeStylePoint,
                    radius: 4,
                    fill: new ol.style.Fill({
                      color: [16,106,144, 1]
                    })
                }),
                fill: new ol.style.Fill({
                  color: [255,255,255, 0.3]
                })
            });
        },

        _bindEvents: function () {
            topic.subscribe('feature.highlightDiagram', lang.hitch(this, this._highlightDiagramFeature));
            topic.subscribe('feature.unhighlightDiagram', lang.hitch(this, this._unhighlightDiagramFeature));
        },

        _highlightDiagramFeature: function (e, s) {
            var feature, geometry;

            // this._source.clear();

            if (e.geom) {
                geometry = this._wkt.readGeometry(e.geom);
            } else if (e.olGeometry) {
                geometry = e.olGeometry;
            }

            feature = new ol.Feature({
                geometry: geometry
            });
            this._source.addFeature(feature);
            feature.setProperties(s);
            
            return feature;
        },

        _unhighlightDiagramFeature: function () {
            this._source.clear();
        },

        highlightDiagramFeatureById: function (featureId, layerId) {
            var get_feature_item_url = api.routeURL('feature_layer.feature.item', {id: layerId, fid: featureId}),
                highlightedDiagramDeferred = new Deferred(),
                feature;

            xhr.get(get_feature_item_url, {
                method: 'GET',
                handleAs: 'json'
            }).then(lang.hitch(this, function (feature) {
                feature = this._highlightDiagramFeature({geom: feature.geom});
                highlightedDiagramDeferred.resolve(feature);
            }));

            return highlightedDiagramDeferred.promise;
        }
    });
});
