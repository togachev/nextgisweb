define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/request/xhr",
    "dojo/topic",
    "dojo/Deferred",
    "@nextgisweb/pyramid/api",
    "ngw-webmap/ol/layer/Vector",
    "openlayers/ol",
], function (declare, lang, xhr, topic, Deferred, api, Vector, ol) {
    return declare("ngw-webmap.FeatureHighlighterDiagram", [], {
        _map: null,
        _source: null,
        _overlay: null,
        _wkt: new ol.format.WKT(),
        _zIndex: 101,

        constructor: function (map, highlightDiagramStyle) {
            this._map = map;
            this._zIndex = this._zIndex + map.layers.length;
            this._overlay = new Vector("highlightDiagram", {
                title: "Highlight Diagram Overlay",
                name: "highlightDiagram",
                style: highlightDiagramStyle
                    ? highlightDiagramStyle
                    : this._getDefaultStyle(),
            });
            this._overlay.olLayer.setZIndex(this._zIndex);
            this._source = this._overlay.olLayer.getSource();

            this._bindEvents();

            this._map.addLayer(this._overlay);
        },

        _getDefaultStyle: function () {
            var strokeStyle = new ol.style.Stroke({
                width: 3,
                color: "rgba(208,77,77,1)",
                lineDash: [4,8],
                lineDashOffset: 6
            });

            return new ol.style.Style({
                stroke: strokeStyle,
                image: new ol.style.Circle({
                    stroke: strokeStyle,
                    radius: 5,
                }),
            });
        },

        _bindEvents: function () {
            topic.subscribe(
                "feature.highlightDiagram",
                lang.hitch(this, this._highlightDiagramFeature)
            );
            topic.subscribe(
                "feature.unhighlightDiagram",
                lang.hitch(this, this._unhighlightDiagramFeature)
            );
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
                geometry: geometry,
            });
            this._source.addFeature(feature);
            feature.setProperties(s);

            return feature;
        },

        _unhighlightDiagramFeature: function (filter) {
            if (filter) {
                var features = this._source.getFeatures();
                for (var i = 0; i < features.length; i++) {
                    if (features[i].getProperties().uniqueId === filter) {
                        this._source.removeFeature(features[i]);
                    }
                }
            } else {
                this._source.clear();
            }
        },

        /**
         * Add highlited layer to the map
         * @param {Polygon} e.geom - polygonal geometry
         * @param {int} [e.layerId] - resource id by which layer highlited
         * @param {int} [e.featureId] - feature id by which layer highlited
         */
        highlightDiagramFeature: function (e) {
            this._highlightDiagramFeature(e);
        },

        /**
         * Callback for filtering features.
         *
         * @callback filterFeatures
         * @param {ol.Feature} feature - An integer.
         * @return {boolean} - is feature satisfy filter
         */

        /**
         * Remove highligh layer from the map
         * @param {filterFeatures} [filter] - callback for filtering features to be removed from the map
         */
        unhighlightDiagramFeature: function (filter) {
            this._unhighlightDiagramFeature(filter);
        },

        getHighlighted: function () {
            return this._source.getFeatures();
        },

        highlightDiagramFeatureById: function (featureId, layerId) {
            var get_feature_item_url = api.routeURL(
                    "feature_layer.feature.item",
                    { id: layerId, fid: featureId }
                ),
                highlightDiagramDeferred = new Deferred();

            xhr.get(get_feature_item_url, {
                method: "GET",
                handleAs: "json",
            }).then(
                lang.hitch(this, function (feature) {
                    feature = this._highlightDiagramFeature({
                        geom: feature.geom,
                        featureId: featureId,
                        layerId: layerId,
                    });
                    highlightDiagramDeferred.resolve(feature);
                })
            );

            return highlightDiagramDeferred.promise;
        },
    });
});
