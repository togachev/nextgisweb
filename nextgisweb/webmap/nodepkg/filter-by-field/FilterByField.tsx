import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Button, Dropdown, Space, DatePicker, message, Card, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route, routeURL } from "@nextgisweb/pyramid/api/route";
import dayjs from 'dayjs';
import { Balancer } from "react-wrap-balancer";

import type { SizeType } from "@nextgisweb/gui/antd";
import type { DojoDisplay } from "../type/index.ts";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/feature-grid/type";
import type WebmapStore from "../store/index.ts";

import History from "@nextgisweb/icon/material/history";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";

import "./FilterByField.less";

import { parseNgwAttribute, formatNgwAttribute } from "../../../feature_layer/nodepkg/util/ngwAttributes.ts";

import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";

const { RangePicker } = DatePicker;

interface FilterByFieldBtnProps {
    id: number;
    display: DojoDisplay;
    store: WebmapStore;
    size?: SizeType;
    setQuery: Dispatch<SetStateAction<string>>;
}

const datatype = "DATE"
const dateFormat = 'YYYY-MM-DD';

const msgAllObject = gettext("Add all layer objects");
const msgRangePicker = gettext("Select date range");
const msgShowLayerFilterByDate = gettext("Filter layer by date");
const msgInfo = gettext("Turn on a layer to get information about an object");
const msgSuccessDataLoaded = gettext("Data loaded");
const msgNoDataAvailable = gettext("No data available");
const msgSelected = gettext("Selected date range");

const SelectedDateRangeCard = ({ value }) => (
    <Card size="small">
        <div className="info-date">{msgSelected}: <span className="selected-date"> {value[0]} - {value[1]}</span></div>
    </Card>
);

const InfoCard = () => (
    <Card size="small">
        <Balancer ratio={0.62} >{msgInfo}</Balancer>
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
    setQuery
}: FilterByFieldBtnProps) => {
    const [dateType, setDateType] = useState<boolean>(false);
    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();
    const [visible, setVisible] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();

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
        if (dateType) {
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

    const map = display.map.olMap;
    const customLayer = display.map.layers.FilterByFieldLayer.olLayer;

    const updateFeature = async () => {
        if (!value.includes['']) {
            return value;
        }
    };

    const setProps = async () => {
        if (!value.includes['']) {
            customLayer.setSource(new VectorSource({
                format: new GeoJSON()
            }))
            customLayer.getSource().setUrl(routeURL("feature_layer.geojson_filter_by_data", id, value[0], value[1]));
            return customLayer
        }
    };

    const featureCount = customLayer.getSource().getFeatures().length;

    useEffect(() => {
        if (status == true && !open) {

            updateFeature()
                .then((item) => {
                    console.log(item);

                    let query = {
                        "fld_data__ge": item[0],
                        "fld_data__le": item[1],
                    }
                    setQuery(query)
                })

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

                });
            setStatus(false);
        }
    }, [status, open]);

    const onOpenChangeRange = (open) => {
        setOpen(open);
    }

    const onChangeRangePicker = (item, dateString) => {
        if (item) {
            setValue(dateString);
            setStatus(true)
        }
        if (!item) {
            clearObject();
        }
    }

    const clearObject = () => {
        customLayer.getSource().clear();
        display._zoomToInitialExtent();
        setStatus(false)
        setVisible(false);
        startValue();
    };

    const addAllObject = () => {
        setValue([dayjs(valueStart[0]).format(dateFormat), dayjs(valueStart[1]).format(dateFormat)])
        setStatus(true)
    };

    return (
        <>
            {contextHolder}
            <Dropdown
                overlayClassName="filter-by-field-menu"
                destroyPopupOnHide={true}
                dropdownRender={() => (
                    <>
                        {dateType ?
                            <div className="menu-filter">
                                <div className="range-picker-input">
                                    <Tooltip title={msgRangePicker}>
                                        <RangePicker
                                            defaultValue={valueStart}
                                            disabledDate={disabledDate}
                                            onOpenChange={onOpenChangeRange}
                                            onChange={onChangeRangePicker}
                                            value={valueStart}
                                        />
                                    </Tooltip>
                                    <Tooltip title={msgAllObject}>
                                        <Button
                                            type="text"
                                            onClick={addAllObject}
                                            icon={<ZoomInMap />}
                                        />
                                    </Tooltip>
                                </div>
                                <div className="info-list">
                                    {visible ? <SelectedDateRangeCard value={value} /> : null}
                                    {featureCount !== 0 ? store.checked.includes(display.item.id[0]) ? <></> : <InfoCard /> : null}
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
