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
    return declare("ngw-webmap.FeatureHighlighter", [], {
        _map: null,
        _source: null,
        _overlay: null,
        _wkt: new ol.format.WKT(),
        _zIndex: 1000,

        constructor: function (map, highlightStyle) {
            this._map = map;
            this._zIndex = this._zIndex + map.layers.length;
            this._overlay = new Vector("highlight", {
                title: "Highlight Overlay",
                style: highlightStyle
                    ? highlightStyle
                    : this._getDefaultStyle(),
            });
            this._overlay.olLayer.setZIndex(this._zIndex);
            this._source = this._overlay.olLayer.getSource();

            this._bindEvents();

            this._map.addLayer(this._overlay);
        },

        _getDefaultStyle: function () {
            const pointClick =
                `<svg id="icon-point-click" version="1.1" viewBox="0 0 13 13" width="13" height="13" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <path d="m6.5 0c-3.58 0-6.5 2.92-6.5 6.5s2.92 6.5 6.5 6.5 6.5-2.92 6.5-6.5-2.92-6.5-6.5-6.5z" fill="#106a92" stroke-width=".929"/>
                        <path d="m5.99 11.5c-2.41-0.248-4.3-2.15-4.54-4.57-0.259-2.58 1.56-4.99 4.12-5.46 2.56-0.472 5.08 1.08 5.8 3.57 0.545 1.89-0.0295 3.89-1.5 5.2-1.05 0.943-2.49 1.41-3.88 1.27z" fill="#fff" stroke-width=".0242"/>
                        <path d="m6.23 9.21c-1.29-0.133-2.31-1.16-2.44-2.46-0.139-1.39 0.839-2.68 2.21-2.94 1.38-0.254 2.73 0.582 3.12 1.92 0.293 1.02-0.0158 2.09-0.804 2.8-0.567 0.507-1.34 0.758-2.09 0.681z" stroke-width=".013"/>
                    </g>
                </svg>`
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    width: 2.26,
                    color: "rgba(255,255,0,1)",
                }),
                fill: new ol.style.Fill({
                    color: "rgba(255,255,255,0.5)",
                }),
                image: new ol.style.Icon({
                    opacity: 1,
                    src: "data:image/svg+xml," + encodeURIComponent(pointClick),
                    scale: 1,
                })
            });
        },

        _bindEvents: function () {
            topic.subscribe(
                "feature.highlight",
                lang.hitch(this, this._highlightFeature)
            );
            topic.subscribe(
                "feature.unhighlight",
                lang.hitch(this, this._unhighlightFeature)
            );
        },

        _highlightFeature: function (e) {
            var feature, geometry;

            this._source.clear();

            if (e.geom) {
                geometry = this._wkt.readGeometry(e.geom);
            } else if (e.olGeometry) {
                geometry = e.olGeometry;
            }
            feature = new ol.Feature({
                geometry: geometry,
                layerId: e.layerId,
                featureId: e.featureId,
            });
            this._source.addFeature(feature);

            return feature;
        },

        _unhighlightFeature: function (filter) {
            if (filter) {
                var features = this._source.getFeatures();
                for (var i = 0; i < features.length; i++) {
                    if (filter(features[i])) {
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
        highlightFeature: function (e) {
            this._highlightFeature(e);
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
        unhighlightFeature: function (filter) {
            this._unhighlightFeature(filter);
        },

        getHighlighted: function () {
            return this._source.getFeatures();
        },

        highlightFeatureById: function (featureId, layerId) {
            var get_feature_item_url = api.routeURL(
                "feature_layer.feature.item",
                { id: layerId, fid: featureId }
            ),
                highlightedDeferred = new Deferred();

            xhr.get(get_feature_item_url, {
                method: "GET",
                handleAs: "json",
            }).then(
                lang.hitch(this, function (feature) {
                    feature = this._highlightFeature({
                        geom: feature.geom,
                        featureId: featureId,
                        layerId: layerId,
                    });
                    highlightedDeferred.resolve(feature);
                })
            );

            return highlightedDeferred.promise;
        },
    });
});
