import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { useRoute } from "@nextgisweb/pyramid/hook/useRoute";
import { useSource } from "./hook/useSource";
import { transformExtent } from "ol/proj";
import {
    Button,
    Card,
    Checkbox,
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
import { formatNgwAttribute, parseNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";
import { topics } from "@nextgisweb/webmap/identify-module"

import BackspaceIcon from "@nextgisweb/icon/material/backspace";
import Remove from "@nextgisweb/icon/material/remove";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterPlusIcon from "@nextgisweb/icon/mdi/filter-plus";

import type { NgwExtent } from "@nextgisweb/feature-layer/type/api";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

import "./FilterLayer.less";

const msgFields = gettext("Fields");
const msgValues = gettext("Values");
const msgSample = gettext("Sample");
const msgIgnoreFilter = gettext("Ignore filter");
const msgAll = gettext("All");
const msgAddFilterField = gettext("Add filter");
const msgRemoveFilterField = gettext("Remove filter");
const msgCancel = gettext("Cancel");
const msgOk = gettext("Ок");
const msgClear = gettext("Clean");
const msgApply = gettext("Apply");
const msgNA = gettext("N/A");
const msgZoomToFiltered = gettext("Zoom to filtered features");
const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

const msgEq = gettext("Equal")
const msgInArray = gettext("Array")
const msgNotInArray = gettext("Not in array")
const msgNotEqual = gettext("Not equal")
const msgLess = gettext("Less")
const msgGreater = gettext("Greater")
const msgLessOrEqual = gettext("Less or equal")
const msgGreaterOrEqual = gettext("Greater or equal")
const msgNoData = gettext("No data")
const msgLike = gettext("LIKE")
const msgIlike = gettext("ILIKE")

const size = "small"

const operator = {
    eq: { label: msgEq, value: "eq" },
    in: { label: msgInArray, value: "in" },
    ne: { label: msgNotEqual, value: "ne" },
    lt: { label: msgLess, value: "lt" },
    gt: { label: msgGreater, value: "gt" },
    le: { label: msgLessOrEqual, value: "le" },
    ge: { label: msgGreaterOrEqual, value: "ge" },
    like: { label: msgLike, value: "like" },
    ilike: { label: msgIlike, value: "ilike" },
    isnull: { label: msgNoData, value: "isnull" },
    notin: { label: msgNotInArray, value: "notin" },
};

const op_type = {
    string: ["like", "ilike", "ne", "eq", "in", "isnull", "notin"],
    number: ["eq", "in", "ne", "lt", "gt", "le", "ge", "isnull", "notin"],
    date: ["eq", "ne", "lt", "gt", "le", "ge", "isnull"],
};

const DATE_TYPE = ["DATETIME", "DATE", "TIME"];
const NUMBER_TYPE = ["REAL", "INTEGER", "BIGINT"];
const ARRAY_OP = ["in", "notin"];

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

type Operators = "like" | "ilike" | "eq" | "in" | "ne" | "lt" | "gt" | "le" | "ge" | "isnull" | "notin";
type TypeProps = "real" | "integer" | "bigint" | "string" | "date" | "datetime" | "time";
type OperatorsIsNull = "yes" | "no";

const FilterInput = (props) => {
    const { id, field, setActiveFields, setInputField, setActiveId, setLock } = props;
    const [vals, setVals] = useState(field.value);
    const [op, setOp] = useState<Operators>();

    const [isNullValue, setIsNullValue] = useState<OperatorsIsNull>("yes");
    const [isNull, setIsNull] = useState(false);

    useEffect(() => {
        setActiveId(id);
    }, []);

    useEffect(() => {
        if (isNull === true) {
            triggerChange({ vals: isNullValue });
        } else {
            triggerChange({ vals: undefined });
            setIsNullValue("yes")
        }
    }, [isNull]);

    const onInputChange = (e) => {
        const newVal = e.target.value;

        if (!("vals" in field.value)) {
            setVals(newVal);
        }

        triggerChange({ vals: newVal });
    };

    const triggerChange = (changedValue: {
        vals?: TypeProps;
        op?: Operators;
    }) => {
        setInputField(prev => ({
            ...prev, [field.item.keyname]: {
                ...prev[field.item.keyname], [id]: { item: field.item, value: { vals, op, ...field.value, ...changedValue } }
            }
        }));
    };

    const onOperatorsChange = (newVal: Operators) => {
        if (!("op" in field.value)) {
            setOp(newVal);
        }

        newVal === "isnull" ? setIsNull(true) : setIsNull(false);
        triggerChange({ op: newVal });
    };

    const onChangeIsNull = (value) => {
        if (field.value.op === "isnull") {
            triggerChange({ vals: value });
            setIsNullValue(value)
        }
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
        style: { width: "100%" },
        size: size,
        placeholder: field.item.display_name,
        onChange: onInputChange,
        value: field.value.vals || undefined,
    };

    useEffect(() => {
        if (typeof field.value.vals === "string" && field.value.op === "isnull") {
            setLock(prev => ({ ...prev, [field.item.keyname + ":" + id]: true }))
        } else {
            setLock(prev => ({ ...prev, [field.item.keyname + ":" + id]: false }))
        }
    }, [field.value.vals, id])

    return (
        <div className="item-control" onClick={() => { setActiveId(id); setActiveFields(field.item.keyname); }}>
            {field.value.op !== "isnull" &&
                <>
                    {type_comp(typeof field.value.vals === "string" ? "STRING" : field.item.datatype, inputProps)}
                    < div className="button-filter">
                        <Button
                            size={size}
                            type="text"
                            icon={<BackspaceIcon />}
                            onClick={() => {
                                triggerChange({ vals: undefined });
                            }}
                        />
                    </div>
                </>}
            <Select
                size={size}
                value={field.value.op || op}
                dropdownStyle={{ width: "auto", minWidth: "165px" }}
                onChange={onOperatorsChange}
                options={op_type[opt].map((item) => {
                    return operator[item];
                })}
            />
            {isNull &&
                <Select
                    size={size}
                    value={isNullValue}
                    onChange={onChangeIsNull}
                    dropdownStyle={{ width: "auto" }}
                    options={[
                        { value: "yes", label: gettext("Yes") },
                        { value: "no", label: gettext("No") },
                    ]}
                />}
        </div >
    );
};

const LoadValues = ({ lock, activeId, inputField, setInputField, activeFields, data }) => {
    const [value, setValue] = useState(undefined);
    const _item = inputField[activeFields][activeId]?.item;
    const _value = inputField[activeFields][activeId]?.value
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
        if (val) {
            if (_item?.datatype === "DATE") {
                const { year, month, day } = val as NgwDate;
                const dt = new Date(year, month - 1, day);
                val = dayjs(dt).format("YYYY-MM-DD");
            } else if (val && _item?.datatype === "TIME") {
                const { hour, minute, second } = val as NgwTime;
                const dt = new Date(0, 0, 0, hour, minute, second);
                val = dayjs(dt).format("HH:mm:ss");
            } else if (val && _item?.datatype === "DATETIME") {
                const { year, month, day, hour, minute, second } = val as NgwDateTime;
                const dt = new Date(year, month - 1, day, hour, minute, second);
                val = dayjs(dt).format("YYYY-MM-DD HH:mm:ss");
            }
            return val;
        }
        else if (val === null || val === "" || val === undefined) {
            return msgNA;
        }
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
                        className={!lock[activeFields + ":" + activeId] ? "item-load" : "item-disable-load"}
                        key={i}
                        title={valDT(item)}
                        onClick={(e) => {
                            if (!lock[activeFields + ":" + activeId] && e.detail === 2) {
                                const val = parseNgwAttribute(_item.datatype, item[activeFields]);
                                if (ARRAY_OP.includes(_value.op)) {
                                    if (_value.vals) {
                                        setInputField(prev => ({
                                            ...prev, [_item.keyname]: {
                                                ...prev[_item.keyname], [activeId]: {
                                                    item: _item, value: {
                                                        op: prev[_item.keyname][activeId].value.op, vals: String(_value.vals)?.concat(',', String(val))
                                                    }
                                                }
                                            }
                                        }));
                                    } else {
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
                                } else {
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
                            }
                        }}
                    >
                        <span>{valDT(item)}</span>
                    </div>
                )
                )}
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
    const [filter, setFilter] = useState(false);
    const [loadValue, setloadValue] = useState({ load: false, limit: 25, distinct: null });
    const [lock, setLock] = useState();

    const { route: extent, isLoading } = useRoute("feature_layer.feature.extent", { id: layerId });

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

                    const op = v.value?.vals ? "__" + v.value.op : "";
                    const string_op = v.item.datatype === "STRING" && ["like", "ilike"].includes(v.value.op) ? "%" : "";
                    const val = typeof v.value.vals === "string" ? v.value.vals : formatNgwAttribute(v.item.datatype, v.value.vals);

                    Object.assign(obj, {
                        [styleId.toString() + k + ":" + "fld_" + value.keyname + op]: string_op + val + string_op
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
        if (loadValue.load && activeFields) {
            getFeature(layerId, loadValue, queryParams, activeFields, filter)
                .then(item => {
                    setData(item.map((i, idx) => ({ ...i, key: String(idx) })))
                    setloadValue({ load: false })
                });
        }
    }, [loadValue]);

    useEffect(() => {
        const obj: object = {}
        getEntries(inputField).map(([_, value]) => {
            Object.assign(obj, value)
        });
        Object.keys(obj).length === 0 && (setQueryParams(null), setFilter(false))
    }, [inputField]);

    const disableLoad = activeFields ? true : false;

    return (<>
        {fields.length > 0 ?
            <div className="component-filter">
                <div className="title-field">
                    <div className="field">{msgFields}</div>
                    <div className="load">{msgValues}</div>
                </div>
                <div className="fields-block">
                    <div className="field-content">
                        <div className="field-items">
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
                                            title={<span title={item.display_name}>{item.display_name}</span>}
                                        >
                                            {getEntries(inputField).map(([key, value]) => {
                                                if (key === item.keyname) {
                                                    return getEntries(value).map(([k, v]) => {
                                                        if (v.item.keyname === item.keyname) {
                                                            return (
                                                                <div className="child-item" id={k} key={k}>
                                                                    <FilterInput setLock={setLock} setActiveFields={setActiveFields} setActiveId={setActiveId} setInputField={setInputField} id={k} field={v} />
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
                    </div>
                    <div className="value-loads">
                        {activeId && disableLoad ?
                            <LoadValues lock={lock} setInputField={setInputField} activeId={activeId} inputField={inputField} activeFields={activeFields} data={data} /> :
                            emptyValue}
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
                            </div>}
                        {disableLoad &&
                            <Checkbox className="ignore-filter" checked={filter} onChange={(e) => {
                                setFilter(e.target.checked)
                            }}>{msgIgnoreFilter}</Checkbox>}
                    </div>
                </div>
                <div className="control-buttons">
                    <div className="button-filter">
                        <Button type="text"
                            title={msgZoomToFiltered}
                            icon={<ZoomInMap />}
                            onClick={click}
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
                            setFilter(false);
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
                            setFilter(false);
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
    </>)
});