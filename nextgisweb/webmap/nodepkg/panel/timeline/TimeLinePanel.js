import { useEffect, useMemo, useState } from "react";
import { Dropdown, Slider, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLinePanel.less";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { PanelHeader } from "../header";
const title = gettext("Timeline")

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

// import VectorTileLayer from 'ol/layer/VectorTile';
// import VectorTileSource from 'ol/source/VectorTile';

// import Feature from 'ol/Feature';
// import MVT from 'ol/format/MVT';
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';

const getDefaultStyle = () => {
    var dataStyle = new Style({
        stroke: new Stroke({
            width: 1.66,
            color: '#FF8B00'
        }),
        image: new Circle({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            stroke: new Stroke({
                width: 1,
                color: 'rgba(0,0,0,0.8)'
            }),
            radius: 4,
            fill: new Stroke({
                width: 1,
                color: 'rgba(16,106,144,0.5)'
            }),
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.5)',
        }),
        text: new Text({
            textAlign: 'center',
            textBaseline: "bottom",
            font: '12px Calibri,sans-serif',

            fill: new Fill({
                color: '#000'
            }),
            stroke: new Stroke({
                color: '#fff',
                width: 2
            }),
            offsetY: -10,
            offsetX: 15,
            placement: "point",
            maxAngle: 0,
            overflow: true,
            rotation: 0,
        })
    });

    return dataStyle;
}

export const TimeLinePanel = ({ display, close }) => {

    const map = display.map.olMap;
    const layers = display._layers;

    Object.keys(layers).map((key, i) => {
        if (!layers[key].itemConfig.timeline) {
            return
        }
        const customSource = new VectorSource({ url: routeURL("resource.geojson", layers[key].itemConfig.layerId), format: new GeoJSON() })
        const customLayer = new VectorLayer({
            style: features => getDefaultStyle(),
            source: customSource
        })
        map.addLayer(customLayer);
        
        // const customLayer = new VectorTileLayer({
        //     declutter: true,
        //     renderBuffer: 200,
        //     renderOrder: null,
        //     renderMode: 'vector',
        //     preload: 0,
        //     useInterimTilesOnError: false,
        //     source: new VectorTileSource({
        //       format: new MVT({
        //         featureClass: Feature,
        //       }),
        //       url: 'http://127.0.0.1:8082/api/component/feature_layer/mvt?resource=' + layers[key].itemConfig.layerId + '&z={z}&x={x}&y={y}',
        //     }),
        //     style: features => getDefaultStyle(),
        //   })


        
    });
     




    return (
        <div className="ngw-webmap-timeline-panel">
            <PanelHeader {...{ title, close }} />

        </div>
    );
}