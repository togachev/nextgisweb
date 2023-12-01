import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Tree, Form, Checkbox, Dropdown, Slider, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLinePanel.less";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { PanelHeader } from "../header";
const title = gettext("Timeline")

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import VectorImageLayer from 'ol/layer/VectorImage';

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

const LayerCheckbox = ({ items, map }) => {
    const [value, setValue] = useState([]);
    const [layers, setLayers] = useState([]);

    const onChange = (value) => {
        setValue(value);
    }

    const options = [];
    items.map(item => {
        options.push({ label: item.label, value: item.layerId });
    })

    const visibleLayer = (map) => {
        const layers = []
        map.getLayers().forEach((layer) => {
            if (layer instanceof VectorImageLayer) {
                layers.push(layer)
            }
        });
        setLayers(layers)
    }

    useEffect(() => {
        layers.map(item => {
            if (value.includes(item.getProperties().id)) {
                item.setVisible(true)
            } else {
                item.setVisible(false)
            }
        })
    }, [layers])

    useEffect(() => {
        visibleLayer(map);
    }, [value])


    return (
        <Form>
            <Form.Item>
                <Checkbox.Group options={options} onChange={onChange} />
            </Form.Item>
        </Form>
    )
}



const initLayersMap = (items, map) => {
    items.map(item => {
        const customSource = new VectorSource({
            url: routeURL("resource.geojson", item.layerId),
            format: new GeoJSON()
        })

        const customLayer = new VectorImageLayer({
            style: function (feature) {
                if (feature.get('data') == '2023-10-06') {
                    return getDefaultStyle();
                } else {
                    return getDefaultStyle();
                }
            },
            source: customSource,

        })
        customLayer.setVisible(false)
        map.addLayer(customLayer);
        customLayer.setProperties({ "id": item.layerId })
        
    });
}

export const TimeLinePanel = ({ display, close }) => {
    const map = display.map.olMap;
    const store = display.webmapStore;
    const items = [...store.webmapItems].filter(item => item.timeline == true);

    initLayersMap(items, map);

    return (
        <div className="ngw-webmap-timeline-panel">
            <PanelHeader {...{ title, close }} />
            <LayerCheckbox items={items} map={map} />
        </div>
    );
}