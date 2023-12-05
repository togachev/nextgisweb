import { useEffect, useState } from "react";
import { Dropdown, Button, DatePicker, Checkbox } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLine.less";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import moment from "moment";
import { parseNgwAttribute } from "../../../feature_layer/nodepkg/util/ngwAttributes.ts";

import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import DoneAll from "@nextgisweb/icon/material/done_all";
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
const msgShowlayer = gettext("Show layer");
const msgHidelayer = gettext("Hide layer");
const msgAllObject = gettext("Add all object layer");


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

    const [valueStart, setValueStart] = useState(['', '']);
    const [value, setValue] = useState(['', '']);
    const [dateType, setDateType] = useState({ layerId: layerId, status: false });
    const [checked, setChecked] = useState(true);

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

    customLayer.setStyle(getDefaultStyle);

    useEffect(() => {
        if (value[0] !== '' && value[1] !== '') {
            customLayer.setSource(new VectorSource({
                format: new GeoJSON()
            }))
            customLayer.getSource().setUrl(routeURL("resource.geojson_filter_by_data", layerId, value[0], value[1]))
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
            <>
                {
                    dateType.status ?
                        <span title={msgShowTimeLime} className="more"
                            onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                            <HistoryOutlined />
                        </span>
                        : null
                }
            </>
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
        display._zoomToInitialExtent();
        setValue(['', ''])
    };

    const onChange = (e) => {
        customLayer.setVisible(e.target.checked)
        setChecked(e.target.checked);
    };

    const label = `${checked ? msgShowlayer : msgHidelayer}`;

    const addAllObject = () => {
        setValue([moment(valueStart[0].toString()).format(dateFormat), moment(valueStart[1].toString()).format(dateFormat)])
    };

    return (
        <Dropdown
            onOpenChange={onOpenChange}
            trigger={["click"]}
            open
            dropdownRender={() => (
                <span className="date-picker-panel" onClick={(e) => { e.stopPropagation(); }}>
                    <RangePicker
                        allowClear={false}
                        defaultValue={valueStart}
                        onChange={onChangeRangePicker}
                    />
                    <Button
                        disabled={value[0] !== '' & value[1] !== '' ? false : true}
                        className="button-style"
                        type="text"
                        title={msgZoomToFiltered}
                        onClick={zoomToObject}
                        icon={<ZoomInMap />}
                    />
                    <Button
                        className="button-style"
                        type="text"
                        title={msgAllObject}
                        onClick={addAllObject}
                        icon={<DoneAll />}
                    />
                    <Button
                        className="button-style"
                        type="text"
                        title={msgClearObject}
                        onClick={clearObject}
                        icon={<DeleteObject />}
                    />
                    <Checkbox className="button-style" defaultChecked={true} onChange={onChange} title={label} />
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