import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { useRoute } from "@nextgisweb/pyramid/hook/useRoute";
import { useSource } from "./hook/useSource";
import { transformExtent } from "ol/proj";
import {
    Button,
    Card,
    DatePicker,
    DateTimePicker,
    Empty,
    TimePicker,
    Input,
    Select,
} from "@nextgisweb/gui/antd";
import dayjs from "dayjs";
import type {
    NgwDate,
    NgwDateTime,
    NgwTime,
} from "@nextgisweb/feature-layer/type";
import { parseNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";
import { topics } from "@nextgisweb/webmap/identify-module"

import BackspaceIcon from "@nextgisweb/icon/material/backspace";
import Remove from "@nextgisweb/icon/material/remove";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterPlusIcon from "@nextgisweb/icon/mdi/filter-plus";

import type { NgwExtent } from "@nextgisweb/feature-layer/type/api";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

import "./FilterLayer.less";

const msgSample = gettext("Sample");
const msgAll = gettext("All");
const msgAddFilterField = gettext("Add filter");
const msgRemoveFilterField = gettext("Remove filter");
const msgCancel = gettext("Cancel");
const msgOk = gettext("Ок");
const msgClear = gettext("Clean");
const msgApply = gettext("Apply");
const msgZoomToFiltered = gettext("Zoom to filtered features");
const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

const size = "small"
const operator = {
    eq: { label: "равно", value: "eq" },
    in: { label: "массив", value: "in" },
    ne: { label: "не равно", value: "ne" },
    lt: { label: "меньше", value: "lt" },
    gt: { label: "больше", value: "gt" },
    le: { label: "меньше или равно", value: "le" },
    ge: { label: "больше или равно", value: "ge" },
    like: { label: "like", value: "like" },
    ilike: { label: "ilike", value: "ilike" },
};

const op_type = {
    string: ["like", "ilike", "ne", "eq", "in"],
    number: ["eq", "in", "ne", "lt", "gt", "le", "ge"],
    date: ["eq", "ne", "lt", "gt", "le", "ge"],
};

const DATE_TYPE = ["DATETIME", "DATE", "TIME"];
const NUMBER_TYPE = ["REAL", "INTEGER", "BIGINT"];

const type_comp = (value, props) => {
    const inputComp = {
        STRING: <Input {...props} />,
        REAL: <Input {...props} />,
        INTEGER: <Input {...props} />,
        BIGINT: <Input {...props} />,
        DATETIME: <DateTimePicker suffixIcon={false} {...props} />,
        DATE: <DatePicker suffixIcon={false} {...props} />,
        TIME: <TimePicker suffixIcon={false} {...props} />,
    }
    return inputComp[value];
};

type Operators = "like" | "ilike" | "eq" | "in" | "ne" | "lt" | "gt" | "le" | "ge";
type TypeProps = "real" | "integer" | "bigint" | "string" | "date" | "datetime" | "time";

const FilterInput = (props) => {
    const { id, field, setActiveFields, setInputField, setActiveId } = props;
    const [vals, setVals] = useState(field.value);
    const [op, setOp] = useState<Operators>();

    useEffect(() => {
        setActiveId(id);
    }, [])

    const onChange = (e) => {
        setInputField(prev => ({ ...prev, [field.item.keyname]: { ...prev[field.item.keyname], [id]: { item: field.item, value: e } } }));
    }

    const triggerChange = (changedValue: {
        vals?: TypeProps;
        op?: Operators;
    }) => {
        onChange?.({ vals, op, ...field.value, ...changedValue });
    };

    const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = field.item.datatype === "STRING" || NUMBER_TYPE.includes(field.item.datatype) ? e.target.value : e;

        if (!("vals" in field.value)) {
            setVals(newVal);
        };
        triggerChange({ vals: newVal });
    };

    const onOperatorsChange = (newVal: Operators) => {
        if (!("op" in field.value)) {
            setOp(newVal);
        };
        triggerChange({ op: newVal });
    };

    let opt;
    if (DATE_TYPE.includes(field.item.datatype)) {
        opt = "date"
    } else if (NUMBER_TYPE.includes(field.item.datatype)) {
        opt = "number"
    } else {
        opt = "string"
    }

    const inputProps = {
        style: { width: "100%", margin: "4px 0" },
        size: size,
        placeholder: field.item.display_name,
        onChange: onFilterChange,
        value: field.value.vals || undefined,
    };

    return (
        <div className="item-control" onClick={() => { setActiveId(id); setActiveFields(field.item.keyname); }}>
            {type_comp(field.item.datatype, inputProps)}
            <div className="button-filter">
                <Button
                    size={size}
                    type="text"
                    icon={<BackspaceIcon />}
                    onClick={() => {
                        triggerChange({ vals: undefined });
                    }}
                />
            </div>
            <Select
                size={size}
                value={field.value.op || op}
                style={{ width: 165, padding: "0 0 0 4px" }}
                onChange={onOperatorsChange}
                options={op_type[opt].map((item) => {
                    return operator[item];
                })}
            />
        </div>
    );
};

const LoadValues = ({ activeId, inputField, setInputField, activeFields, data }) => {
    const [value, setValue] = useState(undefined);
    const _item = inputField[activeFields][activeId]?.item;

    const getData = (data, value) => {
        if (!value) {
            return data;
        }
        if (DATE_TYPE.includes(_item.datatype)) {
            return data.filter((item) => {
                if (valDT(item).toLowerCase().includes(value.toLowerCase())) {
                    return item;
                }
            })
        } else {
            return data.filter((item) => {
                if (String(item[activeFields]).toLowerCase().includes(value.toLowerCase())) {
                    return item;
                }
            })
        }
    };

    const valDT = (item) => {
        let val = item[activeFields];
        if (_item?.datatype === "DATE") {
            const { year, month, day } = val as NgwDate;
            const dt = new Date(year, month - 1, day);
            val = dayjs(dt).format("YYYY-MM-DD");
        } else if (val && _item?.datatype === "TIME") {
            const { hour, minute, second } = val as NgwTime;
            const dt = new Date(0, 0, 0, hour, minute, second);
            val = dayjs(dt).format("HH:mm:ss");
        } else if (val && _item?.datatype === "DATETIME") {
            const { year, month, day, hour, minute, second } =
                val as NgwDateTime;
            const dt = new Date(year, month - 1, day, hour, minute, second);
            val = dayjs(dt).format("YYYY-MM-DD HH:mm:ss");
        }
        return val;
    }

    return (
        <div className="load-content">
            <div className="load-search">
                <Input
                    allowClear
                    placeholder={activeFields}
                    size={size}
                    value={value}
                    onChange={(e) => { setValue(e.target.value) }}
                />
            </div>
            <div className="content">
                {_item && getData(data, value)?.map((item, i) => (
                    <div
                        className="item-load"
                        key={i}
                        title={valDT(item)}
                        onClick={(e) => {
                            if (e.detail === 2) {
                                const _item = inputField[activeFields][activeId]?.item;
                                const val = parseNgwAttribute(_item.datatype, item[activeFields]);
                                setInputField(prev => ({
                                    ...prev, [_item.keyname]: {
                                        ...prev[_item.keyname], [activeId]: {
                                            item: _item, value: {
                                                op: prev[_item.keyname][activeId].value.op, vals: val
                                            }
                                        }
                                    }
                                }));
                            }
                        }}
                    >
                        <span>{valDT(item)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const ComponentFilter = observer((props) => {
    const { display, item, fields, refreshLayer, store } = props;
    const { activeKey, visible, removeTab } = store;
    const { layerId, styleId } = item;
    const defaultInputField = fields.reduce((a, v) => ({ ...a, [v.keyname]: {} }), {});

    const { getFeature } = useSource();

    const [queryParams, setQueryParams] = useState();
    const [data, setData] = useState();
    const [activeFields, setActiveFields] = useState();
    const [inputField, setInputField] = useState(defaultInputField);
    const [activeId, setActiveId] = useState();

    const [loadValue, setloadValue] = useState({ load: false, limit: 25, distinct: null });

    const { route: extent, isLoading } = useRoute("feature_layer.feature.extent", {
        id: layerId,
    });

    const renderFilter = async () => {
        const olMap = display.map.olMap
        const cExt = transformExtent(
            olMap.getView().calculateExtent(olMap.getSize()),
            display.displayProjection,
            display.lonlatProjection
        );
        const cExtent = { maxLon: cExt[2], minLon: cExt[0], maxLat: cExt[3], minLat: cExt[1] };

        await extent.get<NgwExtent>({
            query: queryParams?.fld_field_op || undefined,
            cache: true,
        })
            .then(fExtent => {
                const left = Math.max(fExtent.minLon, cExtent.minLon)
                const right = Math.min(fExtent.maxLon, cExtent.maxLon)
                const bottom = Math.max(fExtent.minLat, cExtent.minLat)
                const top = Math.min(fExtent.maxLat, cExtent.maxLat)
                const nd = left >= right || bottom >= top ? "200" : "204"

                topics.publish("query.params_" + styleId, { queryParams, nd });
                refreshLayer(item.key);
            })
    }

    useEffect(() => {
        renderFilter();
    }, [queryParams]);

    const onFinish = (values) => {
        const keys_ = Object.keys(values || {});
        const obj: object = {};

        getEntries(fields).map(([_, value]) => {
            if (keys_.includes(value.keyname)) {
                const field = values[value.keyname];
                Object.keys(field).length > 0 && getEntries(field)?.map(([k, v]) => {

                    if (!v.value?.vals) {
                        setQueryParams(null)
                        return
                    };
                    const op = v.value?.vals ? "__" + v.value.op : ""; /* оператор */
                    let vf = v.value.vals; /* значение */

                    const opt_ = v.item.datatype === "STRING" && ["like", "ilike"].includes(v.value.op) ? "%" : ""; /* %like%, %ilike% */

                    if (v.item.datatype === "TIME") {
                        vf = v.value.vals.format("H:m:s")
                    } else if (value.datatype === "DATE") {
                        vf = v.value.vals.format("YYYY-MM-DD")
                    } else if (value.datatype === "DATETIME") {
                        vf = v.value.vals.format("YYYY-MM-DD H:m:s")
                    }
                    Object.assign(obj, {
                        [styleId.toString() + k + ":" + "fld_" + value.keyname + op]: opt_ + vf + opt_
                    });
                });
            }
        });

        Object.keys(obj).length > 0 && setQueryParams((prev) => ({
            ...prev,
            fld_field_op: obj,
        }));
    };

    const onZoomToFiltered = (ngwExtent: NgwExtent) => {
        display.map.zoomToNgwExtent(
            ngwExtent,
            display.displayProjection
        );
        refreshLayer(item.key);
    }

    const click = async () => {
        if (!queryParams?.fld_field_op) {
            const resp = await extent.get<NgwExtent>({
                query: queryParams || undefined,
                cache: true,
            });
            onZoomToFiltered(resp);
        } else {
            const resp = await extent.get<NgwExtent>({
                query: queryParams?.fld_field_op || undefined,
                cache: true,
            });
            onZoomToFiltered(resp);
        }
    };

    useEffect(() => {
        if (loadValue.load) {
            getFeature(layerId, loadValue, queryParams)
                .then(item => {
                    setData(item.map((i, idx) => ({ ...i, key: String(idx) })))
                    setloadValue({ load: false })
                });
        }
    }, [loadValue]);

    useEffect(() => {
        !activeFields && setQueryParams(null);
    }, [activeFields]);

    const disableLoad = activeFields ? true : false;

    return (<div className="ngw-filter-layer">
        {fields.length > 0 ?
            <div className="component-filter">
                <div className="title-field">
                    <div className="field">Поля</div>
                    <div className="load">Значения</div>
                </div>
                <div className="fields-block">
                    <div className="field-items" span={16}>
                        {fields.map((item) => {
                            return (
                                <span className="item-field" key={item.id}>
                                    <Card
                                        className="card-block"
                                        extra={<Button type="text"
                                            icon={<FilterPlusIcon />}
                                            title={msgAddFilterField}
                                            size={size}
                                            onClick={() => {
                                                const op = item.datatype === "STRING" ? "ilike" : "eq"
                                                setActiveFields(item.keyname);
                                                setInputField(prev => {
                                                    const length = Object.keys(prev[item.keyname]).length;
                                                    if (length > 0) {
                                                        const keys = Object.keys(prev[item.keyname]).map(i => Number(i))
                                                        return ({
                                                            ...prev, [item.keyname]: {
                                                                ...prev[item.keyname], [Math.max(...keys) + 1]: {
                                                                    item: item, value: { vals: "", op: op }
                                                                }
                                                            }
                                                        });
                                                    } else {

                                                        return ({
                                                            ...prev, [item.keyname]: {
                                                                1: { item: item, value: { vals: "", op: op } }
                                                            }
                                                        });
                                                    }
                                                })
                                                setloadValue({ load: true, limit: 25, distinct: item.keyname });
                                            }}
                                        />}
                                        title={<span title={item.display_name}>
                                            {item.display_name}
                                        </span>}
                                    >
                                        {getEntries(inputField).map(([key, value]) => {
                                            if (key === item.keyname) {
                                                return getEntries(value).map(([k, v]) => {
                                                    if (v.item.keyname === item.keyname) {
                                                        return (
                                                            <div className="child-item" id={k} key={k}>
                                                                <FilterInput setActiveFields={setActiveFields} setActiveId={setActiveId} setInputField={setInputField} id={k} field={v} />
                                                                <div className="button-filter">
                                                                    <Button
                                                                        type="text"
                                                                        size={size}
                                                                        title={msgRemoveFilterField}
                                                                        onClick={() => {
                                                                            setInputField((prev) => {
                                                                                const rField = { ...prev };
                                                                                delete rField[item.keyname][k];
                                                                                return rField;
                                                                            })
                                                                            setData([]);
                                                                            setActiveFields(undefined);
                                                                        }}
                                                                        icon={<Remove />}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                })
                                            }
                                        })}
                                    </Card>
                                </span>
                            )
                        })}
                    </div>
                    <div className="value-loads">
                        {disableLoad ? <LoadValues setInputField={setInputField} activeId={activeId} inputField={inputField} activeFields={activeFields} data={data} /> : emptyValue}
                        {disableLoad &&
                            <div className="load-button">
                                <div className="button-text">
                                    <Button type="text" onClick={() => { setloadValue({ load: true, limit: 25, distinct: activeFields }); }} size={size} title={msgSample}>
                                        {msgSample}
                                    </Button>
                                    <Button type="text" onClick={() => { setloadValue({ load: true, limit: null, distinct: activeFields }) }} size={size} title={msgAll}>
                                        {msgAll}
                                    </Button>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div className="control-buttons">
                    <div className="button-filter">
                        <Button type="text"
                            title={msgZoomToFiltered}
                            icon={<ZoomInMap />}
                            onClick={() => {
                                click();
                            }}
                            size={size}
                            loading={isLoading}
                        />
                    </div>
                    <div className="button-text">
                        <Button type="text" size={size} onClick={() => {
                            onFinish(inputField);
                            setloadValue({ load: true, limit: 25, distinct: activeFields });
                        }}>
                            {msgApply}
                        </Button>
                        <Button type="text" size={size} onClick={() => {
                            setQueryParams(null);
                            refreshLayer(item.key);
                            setData([]);
                            setActiveFields(undefined);
                            setInputField(defaultInputField);
                        }}>
                            {msgClear}
                        </Button>
                        <Button type="text" size={size} onClick={() => {
                            setQueryParams(null);
                            topics.publish("query.params_" + styleId, { queryParams: null, nd: "204" })
                            removeTab(activeKey)
                            topics.publish("removeTabFilter", activeKey);
                            refreshLayer(item.key);
                            setData([]);
                        }}>
                            {msgCancel}
                        </Button>
                        <Button type="text" size={size} onClick={() => {
                            refreshLayer(item.key);
                            visible(true)
                        }}>
                            {msgOk}
                        </Button>
                    </div>
                </div>
            </div > :
            emptyValue
        }
    </div >)
});