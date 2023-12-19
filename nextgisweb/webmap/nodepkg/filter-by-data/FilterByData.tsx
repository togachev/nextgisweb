import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Select, Button, Dropdown, Space, DatePicker, Card, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route, routeURL } from "@nextgisweb/pyramid/api/route";
import { Balancer } from "react-wrap-balancer";

import type { SizeType } from "@nextgisweb/gui/antd";
import type { DojoDisplay } from "../type/index.ts";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/feature-grid/type";
import type WebmapStore from "../store/index.ts";
import type { SelectProps } from 'antd';

import History from "@nextgisweb/icon/material/history";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";

import "./FilterByData.less";

import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";

const { RangePicker } = DatePicker;

interface FilterByDataBtnProps {
    id: number;
    display: DojoDisplay;
    store: WebmapStore;
    size?: SizeType;
    setParams: Dispatch<SetStateAction<string>>;
}

const datatype = "DATE"

const msgAllObject = gettext("Add all layer objects");
const msgSelectField = gettext("Select field");
const msgRangePicker = gettext("Select date range");
const msgShowLayerFilterByDate = gettext("Filter layer by date");
const msgInfo = gettext("Turn on a layer to get information about an object");

const InfoCard = () => (
    <Card size="small">
        <Balancer ratio={0.62} >{msgInfo}</Balancer>
    </Card>
);

const validDate = (feat, r, data) => {
    if (r == 0) {
        if (!!feat[r].fields[data]) {
            return feat[r].fields[data];
        } else {
            return validDate(feat, r + 1, data);
        }
    } else {
        if (!!feat.at(-r).fields[data]) {
            return feat.at(-r).fields[data];
        } else {
            return validDate(feat, r + 1, data);
        }
    }
}

export const FilterByData = ({
    id,
    display,
    store,
    size = "middle",
    setParams,
}: FilterByDataBtnProps) => {
    const [dateType, setDateType] = useState<boolean>(false);
    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();
    const [fields, setFields] = useState<string[]>([]);
    const [currentFieldData, setCurrentFieldData] = useState<string>();

    const options: SelectProps['options'] = [];

    fields.map(item => {
        options.push({ value: item.keyname, label: item.display_name });
    })

    const handleChange = (value: string) => {       
        setCurrentFieldData(value);
    };

    const dataTypeCheck = async () => {
        const fields = await route('feature_layer.field', id).get<FeatureLayerField>({ id: id });

        if (fields.find(item => item.datatype === datatype)) {
            const dataFields = fields.reduce(function (filtered, option) {
                if (option.datatype === datatype) {
                    filtered.push(option);
                }
                return filtered;
            }, []);
            setFields(dataFields)
            setCurrentFieldData(dataFields[0].keyname);
            setDateType(true)
        }
    };

    useEffect(() => {
        dataTypeCheck()
    }, []);

    const startValue = async () => {
        if (dateType) {
            const query = { geom: 'no', extensions: 'no', order_by: currentFieldData }
            const item = await route('feature_layer.feature.collection', id).get({ query });
            let date = [validDate(item, 0, currentFieldData), validDate(item, 1, currentFieldData)];
            setValueStart([parseNgwAttribute(datatype, date[0]), parseNgwAttribute(datatype, date[1])]);
        }
    };

    useEffect(() => {
        startValue()
    }, [dateType, currentFieldData]);

    const disabledDate = (current) => {
        return current && current < valueStart[0] || current && current > valueStart[1];
    };

    const map = display.map.olMap;
    const customLayer = display.map.layers.FilterByDataLayer.olLayer;

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
            customLayer.getSource().setUrl(routeURL("feature_layer.geojson_filter_by_data", id, currentFieldData, value[0], value[1]));
            return customLayer
        }
    };

    useEffect(() => {
        if (status == true && !open) {
            updateFeature()
                .then((item) => {
                    let params = {
                        ["fld_" + currentFieldData + "__ge"]: formatNgwAttribute(datatype, item[0]),
                        ["fld_" + currentFieldData + "__le"]: formatNgwAttribute(datatype, item[1]),
                    }
                    setParams(params)
                })
            setProps()
                .then((item) => {
                    item.getSource().once('change', () => {
                        let extent = item.getSource().getExtent();
                        if (!isFinite(extent[0])) {
                            return;
                        } else {
                            map.getView().fit(extent, map.getSize());
                        }
                    });
                })
            setStatus(false);
        }
    }, [status, open, currentFieldData]);

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
        startValue();
        setParams(undefined)
    };

    const addAllObject = () => {
        setValue([formatNgwAttribute(datatype, valueStart[0]), formatNgwAttribute(datatype, valueStart[1])])
        setStatus(true)
    };

    return (
        <Dropdown
            overlayClassName="filter-by-data-menu"
            destroyPopupOnHide={true}
            trigger={['click']}
            dropdownRender={() => (
                <>
                    {dateType ?
                        <div className="menu-filter">
                            <div className="range-picker-input">
                                <Tooltip title={msgSelectField}>
                                    <Select
                                        defaultValue={currentFieldData}
                                        style={{
                                            maxWidth: 200,
                                            margin: '0 4px 0px 0',
                                        }}
                                        onChange={handleChange}
                                        options={options}
                                    />
                                </Tooltip>
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
    );
};
