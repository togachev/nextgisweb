import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { useRoute } from "@nextgisweb/pyramid/hook/useRoute";
import { useSource } from "./hook/useSource";
import { transformExtent } from "ol/proj";
import {
    Button,
    Col, Row,
    Divider,
    Card,
    DatePicker,
    DateTimePicker,
    Empty,
    TimePicker,
    Input,
    Select,
    Space,
} from "@nextgisweb/gui/antd";
import { topics } from "@nextgisweb/webmap/identify-module"

import BackspaceIcon from "@nextgisweb/icon/material/backspace";
import Remove from "@nextgisweb/icon/material/remove";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterPlusIcon from "@nextgisweb/icon/mdi/filter-plus";

import type { InputRef } from "@nextgisweb/gui/antd";
import type { NgwExtent } from "@nextgisweb/feature-layer/type/api";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

import "./FilterLayer.less";

const msgLoadValue = gettext("Load values");
const msgSample = gettext("Sample");
const msgAll = gettext("All");
const msgAddFilterField = gettext("Add filter");
const msgRemoveFilterField = gettext("Remove filter");
const msgCancel = gettext("Cancel");
const msgOk = gettext("Ок");
const msgClearForm = gettext("Clean");
const msgApplyForm = gettext("Apply");
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

interface FilterValue {
    vals?: TypeProps;
    operator?: Operators;
};

interface FilterInputProps {
    id?: string;
    value?: FilterValue;
    onChange?: (value: FilterValue) => void;
};

const FilterInput: React.FC<FilterInputProps> = (props) => {

    const { value = {}, onChange, field } = props;
    const [vals, setVals] = useState();
    const [op, setOp] = useState<Operators>(field.datatype === "STRING" ? "ilike" : "eq");

    const triggerChange = (changedValue: {
        vals?: TypeProps;
        op?: Operators;
    }) => {
        onChange?.({ vals, op, ...value, ...changedValue });
    };

    const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = field.datatype === "STRING" || NUMBER_TYPE.includes(field.datatype) ? e.target.value : e;

        if (!("vals" in value)) {
            setVals(newVal);
        };
        triggerChange({ vals: newVal });
    };

    const onOperatorsChange = (newVal: Operators) => {
        if (!("op" in value)) {
            setOp(newVal);
        };
        triggerChange({ op: newVal });
    };

    let opt;
    if (DATE_TYPE.includes(field.datatype)) {
        opt = "date"
    } else if (NUMBER_TYPE.includes(field.datatype)) {
        opt = "number"
    } else {
        opt = "string"
    }

    const inputProps = {
        style: { width: "100%", margin: "0 4px" },
        size: size,
        placeholder: field.display_name,
        onChange: onFilterChange,
        value: value.vals,
    };

    return (
        <>
            {type_comp(field.datatype, inputProps)}
            {value.vals && <span
                className="icon-symbol padding-icon"
                onClick={() => {
                    triggerChange({ vals: undefined });
                }}
            >
                <BackspaceIcon />
            </span>}
            <Select
                size={size}
                value={value.op || op}
                style={{ width: 165, padding: "0 5px 0 0" }}
                onChange={onOperatorsChange}
                options={op_type[opt].map((item) => {
                    return operator[item];
                })}
            />
        </>
    );
};

const LoadValues = ({ name, data }) => {
    const [value, setValue] = useState(undefined);

    const getData = (data, value) => {
        if (!value) {
            return data;
        }
        return data.filter((item) => item[name].toLowerCase().includes(value.toLowerCase()));
    };

    return (
        <div className="load-content">
            {getData(data, value)?.length > 10 &&
                <Input
                    allowClear
                    placeholder={name}
                    size={size}
                    value={value}
                    onChange={(e) => { setValue(e.target.value) }}
                />}
            {getData(data, value)?.map(item => (
                <div
                    className="item-load"
                    key={item.key}
                    title={item[name]}
                    onClick={() => {
                        console.log(item);
                    }}
                >
                    <span>{item[name]}</span>
                </div>
            ))}
        </div>
    );
}

export const ComponentFilter = observer((props) => {
    const { display, item, fields, refreshLayer, store } = props;
    const { activeKey, visible, removeTab } = store;
    const { layerId, styleId } = item;

    const { getFeature } = useSource();

    const [queryParams, setQueryParams] = useState();
    const [data, setData] = useState();
    const [activeFields, setActiveFields] = useState();
    const [inputField, setInputField] = useState([]);

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

                field?.map((item, index) => {
                    if (!field[index]?.vals) {
                        setQueryParams(null)
                        return
                    };
                    const op = item?.vals ? "__" + item.op : ""; /* оператор */
                    let vf = field[index].vals; /* значение */

                    const opt_ = value.datatype === "STRING" && ["like", "ilike"].includes(item.op) ? "%" : ""; /* %like%, %ilike% */

                    if (value.datatype === "TIME") {
                        vf = field[index].vals.format("H:m:s")
                    } else if (value.datatype === "DATE") {
                        vf = field[index].vals.format("YYYY-MM-DD")
                    } else if (value.datatype === "DATETIME") {
                        vf = field[index].vals.format("YYYY-MM-DD H:m:s")
                    }
                    Object.assign(obj, {
                        [styleId.toString() + index.toString() + ":" + "fld_" + value.keyname + op]: opt_ + vf + opt_
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
            getFeature(layerId, loadValue)
                .then(item => {
                    setData(item.map((i, idx) => ({ ...i, key: String(idx) })))
                    setloadValue({ load: false })
                });
        }
    }, [loadValue]);

    const disableLoad = activeFields ? true : false;
    console.log(inputField);

    return (<div className="ngw-filter-layer">
        {fields.length > 0 ?
            <div className="component-filter">
                <Row className="title-field">
                    <Col span={16}>Поля</Col>
                    <Col flex="auto">Значения</Col>
                </Row>
                <Row className="fields-block">
                    <Col className="field-items" span={16}>
                        {fields.map((item) => {
                            return (
                                <span className="item-field" key={item.id}>
                                    <Card
                                        className="card-block"
                                        extra={<Button
                                            icon={<FilterPlusIcon />}
                                            title={msgAddFilterField}
                                            size={size}
                                            onClick={() => {
                                                setActiveFields(item.keyname);
                                                setInputField((prev) => {
                                                    if (Object.keys(prev).length > 0) {
                                                        const keys = Object.keys(prev).map(i => Number(i))
                                                        return ({ ...prev, [Math.max(...keys) + 1]: item });
                                                    } else {
                                                        return ({ ...prev, 1: item });
                                                    }
                                                })
                                                setloadValue({ load: true, limit: 25, distinct: item.keyname });
                                            }}
                                        />}
                                        title={<span title={item.display_name}>
                                            {item.display_name}
                                        </span>}
                                    >
                                        {Object.keys(inputField).length > 0 && getEntries(inputField).map(([key, value]) => {
                                            if (value.keyname === item.keyname) {
                                                return (
                                                    <div
                                                        className="child-item"
                                                        key={key}>
                                                        {value.keyname}
                                                        <Button
                                                            title={msgRemoveFilterField}
                                                            onClick={() => {
                                                                setInputField((prev) => {
                                                                    const rField = { ...prev };
                                                                    delete rField[key];
                                                                    return rField;
                                                                })
                                                                setData([]);
                                                                setActiveFields(undefined);
                                                            }}
                                                            icon={<Remove />}
                                                        />
                                                    </div>
                                                )
                                            }
                                        })}
                                    </Card>

                                    {/* <FilterInput items={inputField} /> */}

                                </span>
                            )
                        })}
                    </Col>
                    <Col flex="auto">col-8</Col>
                </Row>
                <Row className="control-filter">
                    <Col span={24}>
                        <div className="control-filters">
                            <Button
                                title={msgZoomToFiltered}
                                icon={<ZoomInMap />}
                                onClick={() => {
                                    click();
                                }}
                                size={size}
                                loading={isLoading}
                            />
                            <Button size={size} onClick={() => {
                                console.log(msgApplyForm)
                            }}>
                                {msgApplyForm}
                            </Button>
                            <Button size={size} onClick={() => {
                                setQueryParams(null);
                                refreshLayer(item.key);
                                setData([]);
                                setActiveFields(undefined);
                            }}>
                                {msgClearForm}
                            </Button>
                            <Button size={size} onClick={() => {
                                setQueryParams(null);
                                topics.publish("query.params_" + styleId, { queryParams: null, nd: "204" })
                                removeTab(activeKey)
                                topics.publish("removeTabFilter", activeKey);
                                refreshLayer(item.key);
                                setData([]);
                            }}>
                                {msgCancel}
                            </Button>
                            <Button size={size} onClick={() => {
                                refreshLayer(item.key);
                                visible(true)
                            }}>
                                {msgOk}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div > :
            emptyValue
        }
    </div >)

    // return (
    //     <div key={styleId} className="component-filter">
    //         {fields.length > 0 ?
    //             (<>
    //                 <div className="form-filters">
    // <Card
    //     className="card-filter-fields"
    //     title="Поля"
    // >
    //                         <Form
    //                             form={form}
    //                             name={"ngw_filter_layer_" + styleId}
    //                             onFinish={onFinish}
    //                             autoComplete="off"
    //                         >
    //                             {fields.map((itm) => (
    //                                 <Form.List key={itm.keyname} name={itm.keyname}>
    //                                     {(field, { add, remove }) => (
    //                                         <div className="field-row">
    //                                             <Card
    //                                                 title={
    // <div
    //     title={msgLoadValue}
    //     className="field-add"
    // >
    //     <span
    //         title={itm.display_name}
    //         className="title-field"
    //     >
    //         {itm.display_name}
    //     </span>
    //     <Button
    //         icon={<FilterPlusIcon />}
    //         title={msgAddFilterField}
    //         size={size}
    //         onClick={() => {
    //             add();
    //             setActiveFields(itm.keyname);
    //             setloadValue({ load: true, limit: 25, distinct: itm.keyname });
    //         }}
    //     />
    // </div>
    //                                                 }
    //                                                 size={size}
    //                                                 key={field.key}
    //                                                 className="card-row"
    //                                             >
    //                                                 {field.map(({ key, name, ...restField }) => (
    //                                                     <div className="card-content" key={key}>
    //                                                         <Form.Item noStyle {...restField} name={[name]} >
    //                                                             <FilterInput field={itm} />
    //                                                         </Form.Item>
    //                                                         <span
    //                                                             className="icon-symbol padding-icon"
    //                                                             title={msgRemoveFilterField}
    //                                                             onClick={() => {
    //                                                                 remove(name);
    //                                                                 setData([]);
    //                                                                 setActiveFields(undefined);
    //                                                                 updateForm();
    //                                                             }}>
    //                                                             <Remove />
    //                                                         </span>
    //                                                     </div>
    //                                                 ))}
    //                                             </Card>
    //                                         </div>
    //                                     )}
    //                                 </Form.List>
    //                             ))}
    //                         </Form>
    //                     </Card>
    //                     <Card
    //                         className="value-filter-fields"
    //                         title="Значения"
    //                         actions={[
    //                             <Button disabled={!disableLoad} key={msgSample} onClick={() => { setloadValue({ load: true, limit: 25, distinct: activeFields }); }} size={size} title={msgSample}>{msgSample}</Button>,
    //                             <Button disabled={!disableLoad} key={msgAll} onClick={() => { setloadValue({ load: true, limit: null, distinct: activeFields }) }} size={size} title={msgAll}>{msgAll}</Button>,
    //                         ]}
    //                     >
    //                         {disableLoad ? <LoadValues name={activeFields} data={data} /> : emptyValue}
    //                     </Card>
    //                 </div>
    //                 <div className="control-filters">
    //                     <Button
    //                         title={msgZoomToFiltered}
    //                         icon={<ZoomInMap />}
    //                         onClick={() => {
    //                             click();
    //                         }}
    //                         size={size}
    //                         loading={isLoading}
    //                     />
    //                     <Button size={size} onClick={() => {
    //                         form.submit();
    //                     }}>
    //                         {msgApplyForm}
    //                     </Button>
    //                     <Button size={size} onClick={() => {
    //                         setQueryParams(null);
    //                         form.resetFields();
    //                         refreshLayer(item.key);
    //                         setData([]);
    //                         setActiveFields(undefined);
    //                     }}>
    //                         {msgClearForm}
    //                     </Button>
    //                     <Button size={size} onClick={() => {
    //                         setQueryParams(null);
    //                         topics.publish("query.params_" + styleId, { queryParams: null, nd: "204" })
    //                         removeTab(activeKey)
    //                         topics.publish("removeTabFilter", activeKey);
    //                         refreshLayer(item.key);
    //                         setData([]);
    //                     }}>
    //                         {msgCancel}
    //                     </Button>
    //                     <Button size={size} onClick={() => {
    //                         updateForm();
    //                         refreshLayer(item.key);
    //                         visible(true)
    //                     }}>
    //                         {msgOk}
    //                     </Button>
    //                 </div>
    //             </>) :
    //             emptyValue}
    //     </div>
    // )
});