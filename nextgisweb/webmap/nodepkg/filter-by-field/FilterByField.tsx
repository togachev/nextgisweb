import { useEffect, useMemo, useState } from "react";
import { route, routeURL } from "@nextgisweb/pyramid/api/route";
import { Button, Dropdown, Space, DatePicker, Checkbox, message, Card, Tooltip } from "@nextgisweb/gui/antd";
import { Balancer } from "react-wrap-balancer";
import { gettext } from "@nextgisweb/pyramid/i18n";

import moment from "moment";

import type { SizeType } from "@nextgisweb/gui/antd";
import type { DojoDisplay } from "../type/index.ts";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/type";
import type WebmapStore from "../store/index.ts";

import History from "@nextgisweb/icon/material/history";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import CenterFocusWeak from "@nextgisweb/icon/material/center_focus_weak";
import CloseIcon from "@nextgisweb/icon/material/close/outline";

import "./FilterByField.less";

import { parseNgwAttribute } from "../../../feature_layer/nodepkg/util/ngwAttributes.ts";

import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style } from 'ol/style';
import VectorSource from "ol/source/Vector";

const { RangePicker } = DatePicker;

interface FilterByFieldBtnProps {
    id: number;
    display: DojoDisplay;
    store: WebmapStore;
    size?: SizeType;
}

const datatype = "DATE"
const dateFormat = 'YYYY-MM-DD';

const msgRangePicker = gettext("Select date range");
const msgShowLayerFilterByDate = gettext("Filter layer by date");
const msgInfo = gettext("Turn on a layer to get information about an object");
const msgShowLayerObjects = gettext("Show layer objects");
const msgHideLayerObjects = gettext("Hide layer objects");
const msgAddFeature = gettext("Zoom to object(s)");
const msgClearObjectsMap = gettext("Clear objects on the map");
const msgAllObject = gettext("Add all layer objects");
const msgSuccessDataLoaded = gettext("Data loaded");
const msgNoDataAvailable = gettext("No data available");

const InfoCard = () => (
    <Card size="small">
        <Balancer >{msgInfo}</Balancer>
    </Card>
);

const validDate = (feat, r) => {
    if (r == 0) {
        if (!!feat[r].fields.data) {
            return feat[r].fields.data;
        } else {
            return validDate(feat, r + 1);
        }
    } else {
        if (!!feat.at(-r).fields.data) {
            return feat.at(-r).fields.data;
        } else {
            return validDate(feat, r + 1);
        }
    }
}

const getDefaultStyle = () => {
    var dataStyle = new Style({
        stroke: new Stroke({
            color: "rgba(255,255,0,0.5)",
            width: 12
        }),
        fill: new Fill({
            color: "rgba(255,255,0,0.2)",
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

export const FilterByField = ({
    id,
    display,
    store,
    size = "middle",
}: FilterByFieldBtnProps) => {
    const [dateType, setDateType] = useState<boolean>(false);
    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();
    const [visible, setVisible] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [checked, setChecked] = useState<boolean>(false);

    const dataTypeCheck = async () => {
        const fields = await route('feature_layer.field', id).get<FeatureLayerField>({ id: id });
        if (fields.find(item => item.datatype === datatype)) {
            setDateType(true)
        }
    };

    useEffect(() => {
        dataTypeCheck()
    }, []);

    const startValue = async () => {
        const fields = await route('resource.item', id).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            const query = { geom: 'no', extensions: 'no', order_by: 'data' }
            const item = await route('feature_layer.feature.collection', id).get({ query });
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
    const customLayer = display.map.layers.FilterByFieldLayer.olLayer;
    customLayer.setZIndex(1000);
    customLayer.setStyle(getDefaultStyle);

    const setProps = async () => {
        if (!value.includes['']) {
            customLayer.setSource(new VectorSource({
                format: new GeoJSON()
            }))
            customLayer.getSource().setUrl(routeURL("feature_layer.geojson_filter_by_data", id, value[0], value[1]));
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
        setVisible(false);
    };

    const onChange = (e) => {
        customLayer.setVisible(e.target.checked)
        setChecked(e.target.checked);
    };

    const zoomToObject = () => {
        const extent = customLayer.getSource().getExtent();
        if (!isFinite(extent[0])) {
            return
        } else {
            map.getView().fit(extent, map.getSize());
        }
    };

    const label = `${checked ? msgHideLayerObjects : msgShowLayerObjects}`;

    return (
        <>
            {contextHolder}
            <Dropdown
                overlayClassName="filter-by-field-menu"
                trigger={['click']}
                dropdownRender={() => (
                    <>
                        {dateType ?
                            <div className="menu-filter">
                                <Tooltip title={msgRangePicker}>
                                    <RangePicker
                                        // allowClear={false}
                                        defaultValue={valueStart}
                                        disabledDate={disabledDate}
                                        onOpenChange={onOpenChangeRange}
                                        onChange={onChangeRangePicker}
                                    />
                                </Tooltip>
                                <Tooltip title={msgAllObject}>
                                    <Button
                                    className="button-all-obj"
                                        type="text"
                                        onClick={addAllObject}
                                        icon={<ZoomInMap />}
                                    />
                                </Tooltip>
                                <div className="button-list">
                                    {
                                        visible ?
                                            <Button
                                                className="button-style"
                                                type="text"
                                                onClick={zoomToObject}
                                                icon={<CenterFocusWeak />}
                                            >{msgAddFeature}</Button>
                                            : <></>
                                    }
                                    {
                                        visible ?
                                            <Checkbox
                                                checked={checked}
                                                className="button-style layer-visible"
                                                defaultChecked={false}
                                                onChange={onChange}
                                                title={label}
                                            >{label}</Checkbox>
                                            : <></>
                                    }
                                    {
                                        visible ?
                                            <Button
                                                className="button-style"
                                                type="text"
                                                onClick={clearObject}
                                                icon={<CloseIcon />}
                                            >{msgClearObjectsMap}</Button>
                                            : <></>
                                    }
                                    {store.checked.includes(display.item.id[0]) ? <></> : <InfoCard />}
                                </div>
                            </div>
                            : null}
                    </>
                )}
            >
                <Button title={msgShowLayerFilterByDate} size={size}>
                    <Space>
                        <History />
                    </Space>
                </Button>
            </Dropdown >
        </>
    );
};
