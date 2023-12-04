import { useEffect, useState } from "react";
import { Dropdown, Button, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLine.less";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { parseNgwAttribute } from "../../../feature_layer/nodepkg/util/ngwAttributes.ts";

import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import DeleteObject from "@nextgisweb/icon/material/delete_forever";
import VectorSource from "ol/source/Vector";

import VectorImageLayer from 'ol/layer/VectorImage';

import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';

const { RangePicker } = DatePicker;
const msgShowTimeLime = gettext("Show time line");
const msgHideTimeLime = gettext("Hide time line");

const datatype = "DATE"
const dateFormat = 'YYYY-MM-DD';

const msgZoomToFiltered = gettext("Zoom to filtered features");
const msgClearObject = gettext("Delete objects");

const getDefaultStyle = () => {
    var dataStyle = new Style({
        stroke: new Stroke({
            width: 5,
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



export function TimeLine({
    nodeData,
    timeLineClickId,
    setTimeLineClickId,
    store,
    display
}) {
    const { id, layerId, timeline } = nodeData;

    const [valueStart, setValueStart] = useState([null, null]);
    const [value, setValue] = useState([null, null]);
    const [featExtent, setFeatExtent] = useState([]);
    const [dateType, setDateType] = useState({ layerId: layerId, status: false });

    if (!timeline) {
        return
    };

    const dataTypeCheck = async () => {
        const fields = await route('resource.item', layerId).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            setDateType({ layerId: layerId, status: true })
        }
    };

    useEffect(() => {
        dataTypeCheck()
    }, []);

    const map = display.map.olMap;

    const customLayer = display.map.layers.timelineLayer.olLayer;

    useEffect(() => {
        if (value[0] !== null && value[1] !== null) {
            customLayer.setStyle(getDefaultStyle);
            customLayer.setSource(new VectorSource({
                format: new GeoJSON()
            }))
            customLayer.getSource().setUrl(routeURL("resource.geojson_filter_by_data", layerId, value[0], value[1]))
            let isSubscribed = true;
            const getFeatureExtent = async () => {
                let ext = customLayer.getSource().getExtent();
                // map.getView().fit(ext, map.getSize());
                console.log(customLayer.getSource());
            }
            getFeatureExtent().catch(console.error);
            return () => isSubscribed = false;
        }
    }, [value]);

    const startValue = async () => {
        const fields = await route('resource.item', layerId).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            const query = { geom: 'no', extensions: 'no', order_by: 'data' }
            const item = await route('feature_layer.feature.collection', layerId).get({ query });
            const date = [item[0].fields.data, item.at(-1).fields.data]
            setValueStart([parseNgwAttribute("DATE", date[0]), parseNgwAttribute("DATE", date[1])]);
        }
    };

    useEffect(() => {
        startValue()
    }, [dateType]);

    if (timeLineClickId === undefined || timeLineClickId !== id) {
        return (
            <>{
                dateType.status ?
                    <span title={msgShowTimeLime} className="more"
                        onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                        <HistoryOutlined />
                    </span>
                    : null
            }</>
        );
    };

    const onOpenChange = () => {
        setTimeLineClickId(undefined);
    };

    const onChangeRangePicker = (item, dateString) => {
        setValue([dateString[0], dateString[1]]);
    };

    const zoomToObject = () => {
        let ext = customLayer.getSource().getExtent();
        map.getView().fit(ext, map.getSize());
    };

    const clearObject = () => {
        customLayer.getSource().clear();
        display._zoomToInitialExtent()
    };

    return (
        <Dropdown
            onOpenChange={onOpenChange}
            trigger={["click"]}
            open
            dropdownRender={() => (
                <span onClick={(e) => { e.stopPropagation(); }}>
                    <RangePicker
                        defaultValue={valueStart}
                        onChange={onChangeRangePicker}
                    />
                    <Button
                        type="text"
                        title={msgZoomToFiltered}
                        onClick={zoomToObject}
                        icon={<ZoomInMap />}
                    />
                    <Button
                        type="text"
                        title={msgClearObject}
                        onClick={clearObject}
                        icon={<DeleteObject />}
                    />
                </span>
            )} >
            <span
                title={msgHideTimeLime}
                className="more"
                onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                <HistoryOutlined />
            </span>
        </Dropdown>
    );
}