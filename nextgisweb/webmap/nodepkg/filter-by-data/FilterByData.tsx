import { useCallback, useEffect, useMemo, useState } from "react";
import { route, routeURL } from "@nextgisweb/pyramid/api/route";
import { Button, Dropdown, Space, DatePicker, Checkbox, message, Card } from "@nextgisweb/gui/antd";
import { Balancer } from "react-wrap-balancer";
import { gettext } from "@nextgisweb/pyramid/i18n";

import moment from "moment";

import type { SizeType } from "@nextgisweb/gui/antd";
import type { DojoDisplay, WebmapItem } from "../type";
import type WebmapStore from "../store";

import History from "@nextgisweb/icon/material/history";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import CenterFocusWeak from "@nextgisweb/icon/material/center_focus_weak";
import DeleteObject from "@nextgisweb/icon/material/delete_forever";

import { parseNgwAttribute } from "../../../feature_layer/nodepkg/util/ngwAttributes.ts";

import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style } from 'ol/style';
import VectorSource from "ol/source/Vector";

interface FilterByDataBtnProps {
    nodeData: WebmapItem;
    display: DojoDisplay;
    store: WebmapStore;
    size?: SizeType;
}

const msgShowLayerFilterByDate = gettext("Filter layer by date");
const msgInfo = gettext("Turn on a layer to get information about an object");
const msgShowLayerObjects = gettext("Show layer objects");
const msgHideLayerObjects = gettext("Hide layer objects");
const msgAddFeature = gettext("Zoom to object(s)");
const msgClearObjectsMap = gettext("Clear objects on the map");

const { RangePicker } = DatePicker;

const InfoCard = () => (
    <Card size="small">
        <Balancer >{msgInfo}</Balancer>
    </Card>
);

const validDate = (feat, r) => {
    if (r == 0) {
        if (feat[r].fields.data !== null & feat[r].fields.data !== undefined) {
            return feat[r].fields.data;
        } else {
            return validDate(feat, r + 1);
        }
    } else {
        if (feat.at(-r).fields.data !== null & feat.at(-r).fields.data !== undefined) {
            return feat.at(-r).fields.data;
        } else {
            return validDate(feat, r + 1);
        }
    }
}


const datatype = "DATE"
const dateFormat = 'YYYY-MM-DD';

const msgAllObject = gettext("Add all layer objects");
const msgSuccessDataLoaded = gettext("Data loaded");
const msgNoDataAvailable = gettext("No data available");

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



const success = (messageApi) => {
    messageApi.open({
        type: 'success',
        content: msgSuccessDataLoaded,
    });
};

const error = (messageApi) => {
    messageApi.open({
        type: 'error',
        content: msgNoDataAvailable,
    });
};

export const FilterByData = ({
    nodeData,
    display,
    store,
    size = "middle",
}: FilterByDataBtnProps) => {
    const { id, layerId, filter_by_data } = nodeData;

    const [dateType, setDateType] = useState<{ layerId: number; status: boolean }>({
        layerId: layerId,
        salary: false,
    });

    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();
    const [visible, setVisible] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [checked, setChecked] = useState<boolean>(false);

    if (!filter_by_data) { return };

    const dataTypeCheck = async () => {
        const fields = await route('resource.item', layerId).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            setDateType({ layerId: layerId, status: true })
        }
    };

    useMemo(() => {
        dataTypeCheck()
    }, []);

    const startValue = async () => {
        const fields = await route('resource.item', layerId).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            const query = { geom: 'no', extensions: 'no', order_by: 'data' }
            const item = await route('feature_layer.feature.collection', layerId).get({ query });
            let date = [validDate(item, 0), validDate(item, 1)];
            setValueStart([parseNgwAttribute("DATE", date[0]), parseNgwAttribute("DATE", date[1])]);
        }
    };

    useEffect(() => {
        startValue()
    }, [dateType]);

    const disabledDate = (current) => {
        return current && current < valueStart[0] || current && current > valueStart[1];
    };

    const addAllObject = () => {
        setValue([moment(valueStart[0].toString()).format(dateFormat), moment(valueStart[1].toString()).format(dateFormat)])
        setStatus(true)
        setChecked(true);
    };

    const map = display.map.olMap;
    const customLayer = display.map.layers.FilterByDataLayer.olLayer;
    customLayer.setZIndex(1000);
    customLayer.setStyle(getDefaultStyle);

    const setProps = async () => {
        if (!value.includes['']) {
            customLayer.setSource(new VectorSource({
                format: new GeoJSON()
            }))
            customLayer.getSource().setUrl(routeURL("feature_layer.geojson_filter_by_data", layerId, value[0], value[1]));
            return customLayer
        }
    };

    useEffect(() => {
        if (status == true && !open) {
            setProps()
                .then((item) => {
                    item.getSource().once('change', function () {
                        let extent = item.getSource().getExtent();
                        if (!isFinite(extent[0])) {
                            setVisible(false)
                            error(messageApi)
                            return
                        } else {
                            setVisible(true)
                            success(messageApi)
                            map.getView().fit(extent, map.getSize());
                        }
                    });

                })
            setStatus(false)
        }
    }, [status, open]);

    const onOpenChangeRange = (open) => {
        setOpen(open);
    }

    const onChangeRangePicker = (item, dateString) => {
        if (item) {
            setValue(dateString);
            setStatus(true)
            setChecked(true);
        }
    }

    const clearObject = () => {
        customLayer.getSource().clear();
        display._zoomToInitialExtent();
        setStatus(false)
        setChecked(false);
        setVisible(false)
    };

    const onChange = (e) => {
        customLayer.setVisible(e.target.checked)
        setChecked(e.target.checked);
    };

    const label = `${checked ? msgHideLayerObjects : msgShowLayerObjects}`;

    const zoomToObject = () => {
        let extent = customLayer.getSource().getExtent();
        if (!isFinite(extent[0])) {
            return
        } else {
            map.getView().fit(extent, map.getSize());
        }
    };

    return (
        <>
            {contextHolder}
            <Dropdown
                dropdownRender={() => (
                    <>
                        <span className="date-picker-panel" onClick={(e) => { e.stopPropagation(); }}>
                            <RangePicker
                                allowClear={false}
                                defaultValue={valueStart}
                                disabledDate={disabledDate}
                                onOpenChange={onOpenChangeRange}
                                onChange={onChangeRangePicker}
                            />
                            <Button
                                className="button-style"
                                type="text"
                                title={msgAllObject}
                                onClick={addAllObject}
                                icon={<ZoomInMap />}
                            />
                            {
                                visible ?
                                    <Button
                                        className="button-style"
                                        type="text"
                                        title={msgAddFeature}
                                        onClick={zoomToObject}
                                        icon={<CenterFocusWeak />}
                                    /> : <></>
                            }
                            {
                                visible ?
                                    <Checkbox
                                        checked={checked}
                                        className="button-style"
                                        defaultChecked={false}
                                        onChange={onChange}
                                        title={label}
                                    /> : <></>
                            }
                            {
                                visible ?
                                    <Button
                                        className="button-style"
                                        type="text"
                                        title={msgClearObjectsMap}
                                        onClick={clearObject}
                                        icon={<DeleteObject />}
                                    /> : <></>
                            }
                        </span>
                        {store.checked.includes(nodeData.id) ? <></> : <InfoCard />}
                    </>
                )}
            >
                <Button title={msgShowLayerFilterByDate} size={size}>
                    <Space>
                        <History />
                    </Space>
                </Button>
            </Dropdown>
        </>
    );
};
