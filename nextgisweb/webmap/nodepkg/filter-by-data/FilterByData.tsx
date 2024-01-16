import { useCallback, useEffect, useState } from "react";
import { Button, Dropdown, DatePicker, Tooltip } from "@nextgisweb/gui/antd";

import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";
import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

import type { QueryParams } from "@nextgisweb/feature-layer/feature-grid/hook/useFeatureTable";
import type { FeatureLayerField, SetValue } from "@nextgisweb/feature-layer/feature-grid/type";

import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterIcon from "@nextgisweb/icon/material/filter_alt";

import "./FilterByData.less";

const { RangePicker } = DatePicker;

const msgAllInterval = gettext("Apply filter for entire interval");
const msgRangePicker = gettext("Select date range");

const dt = '1970-01-01';

interface FilterByDataProps {
    resourceId: number;
    styleId: number;
    column: FeatureLayerField;
    queryParams?: QueryParams;
    setQueryParams: (queryParams: SetValue<QueryParams | null>) => void;
    dataType: string[];
}

export const FilterByData = ({
    resourceId,
    styleId,
    column,
    queryParams,
    setQueryParams,
    dataType
}: FilterByDataProps) => {
    const { keyname, datatype } = column;
    
    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();

    const [isSending, setIsSending] = useState(false)
    
    const startValue = useCallback(async () => {
        if (isSending) return;
        setIsSending(true)
        const query = { geom: 'no', extensions: 'no', order_by: keyname, ["fld_" + keyname + "__ne"]: dt }
        const item = await route('feature_layer.feature.collection', resourceId).get({ query });

        const date = [item[0].fields[keyname], item.at(-1).fields[keyname]];

        item ? value.length > 0 ? setValueStart(value) :
            setValueStart([parseNgwAttribute(datatype, date[0]), parseNgwAttribute(datatype, date[1])]) : null

        setIsSending(false)
    }, [isSending])

    useEffect(() => {
        if (status && !open) {
            if (!value.includes['']) {
                let params = {
                    keyname: keyname,
                    styleId: styleId,
                    ["fld_" + keyname + "__ge"]: formatNgwAttribute(datatype, value[0]),
                    ["fld_" + keyname + "__le"]: formatNgwAttribute(datatype, value[1]),
                }

                setQueryParams((prev) => ({
                    ...prev,
                    fld_field_op: params,
                }));
            }
        }
    }, [status, open]);

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
            setQueryParams(undefined)
            setStatus(false);
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
                                allowClear={false}
                                defaultValue={valueStart}
                                showTime={datatype === "DATETIME" ? true : false}
                                disabledDate={disabledDate}
                                onOpenChange={onOpenChangeRange}
                                onChange={onChangeRangePicker}
                                value={valueStart}
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
                type="text"
                onClick={(e) => {
                    e.stopPropagation();
                    startValue();
                }}
                icon={dataType.includes(datatype) && (<FilterIcon />)}
            />
        </Dropdown >
    )
}

export default FilterByData;
