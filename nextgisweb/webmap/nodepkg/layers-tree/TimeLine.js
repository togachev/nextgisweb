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

import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style } from 'ol/style';

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
            color: "rgba(255,255,0,0.5)",
            width: 12
        }),
        image: new Circle({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            stroke: new Stroke({
                color: "rgba(255,255,0,0.5)",
                width: 12
            }),
            radius: 4,
            fill: new Stroke({
                width: 1,
                color: 'rgba(16,106,144,0.5)'
            }),
        }),
        fill: new Fill({
            color: "rgba(255,255,0,0.5)",
            width: 12
        })
    });

    return dataStyle;
}

export function TimeLine({
    nodeData,
    timeLineClickId,
    setTimeLineClickId,
    display
}) {
    const { id, layerId, timeline } = nodeData;

    const [valueStart, setValueStart] = useState(['', '']);
    const [value, setValue] = useState(['', '']);
    const [dateType, setDateType] = useState({ layerId: layerId, status: false });
    const [checked, setChecked] = useState(false);
    const [status, setStatus] = useState(false);

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

    const setProps = async () => {
        customLayer.setSource(new VectorSource({
            format: new GeoJSON()
        }))
        customLayer.getSource().setUrl(routeURL("resource.geojson_filter_by_data", layerId, value[0], value[1]))
    };

    useEffect(() => {
        if (status) {
            setProps()
            setStatus(false)
        }
    }, [status]);

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
        setValue(dateString);
        setStatus(true)
        setChecked(true);
    };

    const zoomToObject = () => {
        let ext = customLayer.getSource().getExtent();
        if (!isFinite(ext[0])) {
            return
        } else {
            map.getView().fit(ext, map.getSize());
        }
    };

    const clearObject = () => {
        customLayer.getSource().clear();
        display._zoomToInitialExtent();
        setStatus(false)
        setChecked(false);
    };

    const onChange = (e) => {
        customLayer.setVisible(e.target.checked)
        setChecked(e.target.checked);
    };

    const label = `${checked ? msgShowlayer : msgHidelayer}`;

    const addAllObject = () => {
        setValue([moment(valueStart[0].toString()).format(dateFormat), moment(valueStart[1].toString()).format(dateFormat)])
        setStatus(true)
        setChecked(true);
    };

    const onCalendarChange = (item, dateString) => {
        setValue(dateString);
        setStatus(true)
        setChecked(true);
    }

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
                        onCalendarChange={onCalendarChange}
                    />
                    <Button
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
                    <Checkbox checked={checked} className="button-style" defaultChecked={false} onChange={onChange} title={label} />
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