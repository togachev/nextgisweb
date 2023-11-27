import { useEffect, useMemo, useState } from "react";
import { Dropdown, Slider, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLinePanel.less";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { PanelHeader } from "../header";
const title = gettext("Timeline")

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

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

    const layers = display.map.layers;

    const layersIdx = display._layer_order


    console.log(display.webmapStore._layers);
    //     const customSource = new VectorSource({ url: props.url, format: props.format })
    //     const customLayer = new VectorLayer({
    //         style: features => getDefaultStyle(),
    //         source: customSource
    //     })
    //     customLayer.set("name", props.info.file.uid);
    //     map.addLayer(customLayer);
    //     props.info.fileList.length <= 1 &&
    //         customSource.once('change', function (e) {
    //             if (customSource.getState() === 'ready') {
    //                 map.getView().fit(customSource.getExtent(), map.getSize());
    //             }
    //         });


    // const olLayerMap = (url, info) => {
    //     switch (info.file.type) {
    //         case 'application/geo+json':
    //             addLayerMap({ info: info, url: url, format: new GeoJSON() })
    //             break;
    //         default:
    //             return;
    //     }
    // }


    return (
        <div className="ngw-webmap-timeline-panel">
            <PanelHeader {...{ title, close }} />

        </div>
    );
}