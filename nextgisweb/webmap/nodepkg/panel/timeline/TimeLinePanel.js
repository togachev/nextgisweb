import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Form, Checkbox, Dropdown, Slider, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLinePanel.less";
import { route, routeURL } from "@nextgisweb/pyramid/api";
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

const LayerCheckbox = observer(({ store, map }) => {
    const items = [...store.webmapItems];

    const onChange = (checkedValues) => {
        console.log(checkedValues);
    }
    const options = [];
    items.map(item => {
        options.push({ label: item.label, value: item.label });
    })
    map.getLayers().forEach(function (layer) {
        if (layer instanceof VectorLayer)
            console.log(layer.getSource());
    });

    return (
        <Form>
            <Form.Item>
                <Checkbox.Group options={options} onChange={onChange} />
            </Form.Item>
        </Form>
    )
})

export const LayersTree = observer

export const TimeLinePanel = ({ display, close }) => {
    const map = display.map.olMap;
    const store = display.webmapStore;
    const items = display.webmapStore._layers;

    Object.keys(items).map((key, i) => {
        if (items[key].itemConfig.timeline) {

            const customSource = new VectorSource({
                url: routeURL("resource.geojson", items[key].itemConfig.layerId),
                format: new GeoJSON()
            })

            const customLayer = new VectorLayer({
                style: function (feature) {
                    if (feature.get('data') == '2023-10-06') {
                        return getDefaultStyle();
                    }
                },
                source: customSource
            })

            map.addLayer(customLayer);
        }
    });

    return (
        <div className="ngw-webmap-timeline-panel">
            <PanelHeader {...{ title, close }} />
            <LayerCheckbox store={store} map={map} />
        </div>
    );
}