import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Select, Button, Dropdown, Space, DatePicker, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";

import type { SizeType } from "@nextgisweb/gui/antd";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/feature-grid/type";
import type { SelectProps } from 'antd';

import History from "@nextgisweb/icon/material/history";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterIcon from "@nextgisweb/icon/material/filter_alt";


import "./FilterByData.less";

import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

const { RangePicker } = DatePicker;

const msgAllInterval = gettext("Apply filter for entire interval");
const msgRangePicker = gettext("Select date range");

interface FilterByDataProps {
    resourceId: number;
    column: FeatureLayerField;
    setParams: Dispatch<SetStateAction<string>>;
    params?: string;
}

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
    resourceId,
    column,
    setParams,
    params,
}: FilterByDataProps) => {
    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();

    const {
        keyname,
        id,
        display_name: label,
        flex,
        datatype
    } = column;

    const startValue = async () => {
        const query = { geom: 'no', extensions: 'no', order_by: keyname }
        const item = await route('feature_layer.feature.collection', resourceId).get({ query });
        const date = [validDate(item, 0, keyname), validDate(item, 1, keyname)];
        return date;
    };
    
    useEffect(() => {
        startValue()
            .then((date) => {
                date ?
                    setValueStart([parseNgwAttribute(datatype, date[0]), parseNgwAttribute(datatype, date[1])])
                    : null
            })
    }, [keyname]);

    useEffect(() => {
        if (status && !open) {
            if (!value.includes['']) {
                let paramsNew = {
                    ["fld_" + keyname + "__ge"]: formatNgwAttribute(datatype, value[0]),
                    ["fld_" + keyname + "__le"]: formatNgwAttribute(datatype, value[1]),
                }
                let unionParams = {
                    ...paramsNew,
                    ...params,
                };
                setParams(unionParams)
                setStatus(false);
            }
        }
    }, [status, open, keyname]);

    const disabledDate = (current) => {
        return current && current < valueStart[0] || current && current > valueStart[1];
    };

    const onOpenChangeRange = (open) => {
        setOpen(open);
    }

    const onChangeRangePicker = (item) => {
        if (item) {
            setValue(item);
            setStatus(true)
        } else {
            setValue([]);
            setParams(undefined)
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
                <div className="menu-filter"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <div className="range-picker-input">
                        <Tooltip title={msgRangePicker}>
                            <RangePicker
                                defaultValue={valueStart}
                                showTime={datatype === "DATETIME" ? true : false}
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
            )}
        >
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                }}
                type="text"
                title="Filter by DATE and DATE" size="small"
                >
                <Space>
                    <FilterIcon />
                </Space>
            </Button>
        </Dropdown >
    )
}

export default FilterByData;
