import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Select, Button, Dropdown, Space, DatePicker, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";

import type { FeatureGridStore } from "../FeatureGridStore";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/feature-grid/type";
import type { SelectProps } from 'antd';

import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterIcon from "@nextgisweb/icon/material/filter_alt";


import "./FilterByData.less";

import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

const { RangePicker } = DatePicker;

const msgAllInterval = gettext("Apply filter for entire interval");
const msgRangePicker = gettext("Select date range");
const msgSelectField = gettext("Select field");

const dataType = ["DATE", "DATETIME"]
const dt = '1970-01-01';

interface FilterByDataProps {
    resourceId: number;
    fields: FeatureLayerField[];
    visibleFields?: number[];
    store: FeatureGridStore;
}

export const FilterByData = ({
    resourceId,
    fields,
    visibleFields = [],
    store,
}: FilterByDataProps) => {
    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();
    const [currentField, setCurrentField] = useState<string>();
    
    console.log(valueStart, value);
    

    const options: SelectProps['options'] = [];
    const columnFilter = fields.filter((item) => dataType.includes(item.datatype) && visibleFields.includes(item.id))
    columnFilter.map(item => {
        options.push({ value: item.id, label: item.display_name });
    })



    const startValue = async () => {
        const query = { geom: 'no', extensions: 'no', order_by: currentField.keyname, ["fld_" + currentField.keyname + "__ne"]: dt }
        const item = await route('feature_layer.feature.collection', resourceId).get({ query });
        return item;
    };
    
    useEffect(() => {
        if (currentField) {
            startValue()
                .then((item) => {
                    console.log(item);
                    const date = [item[0].fields[currentField.keyname], item.at(-1).fields[currentField.keyname]];
                    item ?
                        setValueStart([parseNgwAttribute(currentField.datatype, date[0]), parseNgwAttribute(currentField.datatype, date[1])])
                        : null
                })
        }

    }, [currentField]);
    console.log(store.queryParams);
    
    useEffect(() => {
        if (status && !open && currentField) {
            if (!value.includes['']) {
                let fld = {
                    ["fld_" + currentField.keyname + "__ge"]: formatNgwAttribute(currentField.datatype, value[0]),
                    ["fld_" + currentField.keyname + "__le"]: formatNgwAttribute(currentField.datatype, value[1]),
                }

                store.setQueryParams({
                    ...store.queryParams,
                    parameters: fld,
                })
                setStatus(false);
            }
        }
    }, [status, open, currentField]);

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
        }
    }

    const addAllObject = () => {
        setValue(valueStart)
        setStatus(true)
    };
    const handleChange = (value: number) => {
        setCurrentField(columnFilter.find(item => item.id === value));
        setValue([]);
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
                        <Tooltip title={msgSelectField}>
                            <Select
                                defaultValue={currentField}
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
                                showTime={currentField?.datatype === "DATETIME" ? true : false}
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
