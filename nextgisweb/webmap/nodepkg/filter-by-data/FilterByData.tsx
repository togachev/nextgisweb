import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Select, Button, Dropdown, Space, DatePicker, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";

import type { SizeType } from "@nextgisweb/gui/antd";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/feature-grid/type";
import type { SelectProps } from 'antd';

import History from "@nextgisweb/icon/material/history";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";

import "./FilterByData.less";

import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

const { RangePicker } = DatePicker;

interface FilterByDataBtnProps {
    id: number;
    size?: SizeType;
    setParams: Dispatch<SetStateAction<string>>;
}

const datatype = "DATE"

const msgAllInterval = gettext("Apply filter for entire interval");
const msgSelectField = gettext("Select field");
const msgRangePicker = gettext("Select date range");
const msgShowLayerFilterByDate = gettext("Filter layer by date");

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
            const date = [validDate(item, 0, currentFieldData), validDate(item, 1, currentFieldData)];
            return date;
        }
    };

    useEffect(() => {
        startValue()
            .then((date) => {
                date ? setValueStart([parseNgwAttribute(datatype, date[0]), parseNgwAttribute(datatype, date[1])]) : null
            })
    }, [dateType, currentFieldData]);

    const disabledDate = (current) => {
        return current && current < valueStart[0] || current && current > valueStart[1];
    };

    useEffect(() => {
        if (status && !open) {
            if (!value.includes['']) {
                let params = {
                    ["fld_" + currentFieldData + "__ge"]: formatNgwAttribute(datatype, value[0]),
                    ["fld_" + currentFieldData + "__le"]: formatNgwAttribute(datatype, value[1]),
                }
                setParams(params)
                setStatus(false);
            }
        }
    }, [status, open, currentFieldData]);

    const onOpenChangeRange = (open) => {
        setOpen(open);
    }

    const handleChange = (value: string) => {
        setCurrentFieldData(value);
        setValue([]);
    };

    console.log('выбор поля', valueStart)

    const onChangeRangePicker = (item) => {
        if (item) {
            setValue(item);
            setStatus(true)
        } else {
            setValue([]);
            // setValueStart([]);
            // setStatus(false)
            // startValue();
            setParams(undefined)
            // setOpen(!open);
        }
    }

    const addAllObject = () => {
        setValue(valueStart)
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
                                        value={value.length > 0 ? value : valueStart.length > 0 ? valueStart : []}
                                    />
                                </Tooltip>
                                <Tooltip title={msgAllInterval}>
                                    <Button
                                        type="text"
                                        onClick={addAllObject}
                                        icon={<ZoomInMap />}
                                    />
                                </Tooltip>
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
