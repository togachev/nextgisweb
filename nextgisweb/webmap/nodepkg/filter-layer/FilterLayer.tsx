import React, { forwardRef, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Form } from "@nextgisweb/gui/fields-form";
import {
    Button,
    Card,
    DatePicker,
    DateTimePicker,
    Tabs,
    TimePicker,
    Input,
    Select,
} from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import { topics } from "@nextgisweb/webmap/identify-module"
import { useOutsideClick } from "@nextgisweb/webmap/useOutsideClick";
import { useSource } from "./hook/useSource";
import { FilterLayerStore } from "./FilterLayerStore";

import BackspaceIcon from "@nextgisweb/icon/material/backspace";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import FilterAltOffIcon from "@nextgisweb/icon/material/filter_alt_off";
import Minimize from "@nextgisweb/icon/material/minimize";
import OpenInFull from "@nextgisweb/icon/material/open_in_full/outline";
import Remove from "@nextgisweb/icon/material/remove";

import type { InputRef } from "@nextgisweb/gui/antd";
import type { ParamOf } from "@nextgisweb/gui/type";
import type { ResourceItem } from "@nextgisweb/resource/type/Resource";

type TabItems = NonNullable<ParamOf<typeof Tabs, "items">>;
type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

import "./FilterLayer.less";

const msgTitleFilter = gettext("Filter");
const msgAddFilterField = gettext("Add filter");
const msgRemoveFilterField = gettext("Remove filter");
const msgCancel = gettext("Cancel");
const msgOk = gettext("Ок");
const msgClearForm = gettext("Clean");
const msgCheckForm = gettext("Check");

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

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
    const [op, setOp] = useState<Operators>("eq");

    const inputRef = useRef<InputRef>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [inputRef.current]);

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
        style: { width: "100%", margin: "0 4px 0 0" },
        placeholder: field.display_name,
        onChange: onFilterChange,
        value: value.vals,
        ref: inputRef,
    };

    return (
        <>
            {type_comp(field.datatype, inputProps)}
            {value.vals && <span
                className="icon-symbol padding-icon"
                onClick={() => {
                    triggerChange({ vals: undefined })
                }}
            >
                <BackspaceIcon />
            </span>}
            <Select
                value={value.op || op}
                style={{ width: 165, padding: "0 5px 0 0" }}
                onChange={onOperatorsChange}
                options={op_type[opt].map((item) => {
                    return operator[item];
                })}
            />
        </>
    );
}

const ComponentFilter = observer((props) => {
    const { layerId, id, fields, store } = props;
    const { activeKey, visible, removeTab, queryParams, setQueryParams } = store;

    const [form] = Form.useForm();

    useEffect(() => {
        topics.publish("query.params_" + layerId, queryParams);
    }, [queryParams]);

    const onFinish = (values) => {
        const keys_ = Object.keys(values || {});
        const obj: object = {};
        getEntries(fields).map(([_, value], idx) => {
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
                        [id.toString() + index.toString() + ":" + "fld_" + value.keyname + op]: opt_ + vf + opt_
                    });
                });
            }
        });

        Object.keys(obj).length > 0 && setQueryParams((prev) => ({
            ...prev,
            fld_field_op: obj,
        }));
    };

    const updateForm = () => {
        form
            .validateFields()
            .then((values) => {
                onFinish(values);
            });
    }

    return (
        <div key={id} className="component-filter">
            <div className="form-filters">
                <Form
                    form={form}
                    name={"ngw_filter_layer_" + id}
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    {fields.map((item) => (
                        <Form.List key={item.keyname} name={item.keyname}>
                            {(field, { add, remove }) => (
                                <div className="field-row">
                                    <Card
                                        title={
                                            <Button
                                                title={msgAddFilterField}
                                                size="small"
                                                onClick={() => {
                                                    add();
                                                }}
                                            >
                                                {item.display_name}
                                            </Button>
                                        }
                                        size="small"
                                        key={field.key}
                                        className="card-row"
                                    >
                                        {field.map(({ key, name, ...restField }) => (
                                            <div className="card-content" key={key}>
                                                <Form.Item noStyle {...restField} name={[name]} >
                                                    <FilterInput field={item} />
                                                </Form.Item>
                                                <span
                                                    className="icon-symbol padding-icon"
                                                    title={msgRemoveFilterField}
                                                    onClick={() => {
                                                        remove(name);
                                                        updateForm();
                                                    }}>
                                                    <Remove />
                                                </span>
                                            </div>
                                        ))}
                                    </Card>
                                </div>
                            )}
                        </Form.List>
                    ))}
                </Form>
            </div>
            <div className="control-filters">
                <Button size="small" onClick={() => {
                    form.submit();
                }}>
                    {msgCheckForm}
                </Button>
                <Button size="small" onClick={() => {
                    setQueryParams(null);
                    form.resetFields();
                }}>
                    {msgClearForm}
                </Button>
                <Button size="small" onClick={() => {
                    setQueryParams(null);
                    topics.publish("query.params_" + layerId, null)
                    removeTab(activeKey)
                    topics.publish("removeTabFilter", activeKey);
                    
                }}>
                    {msgCancel}
                </Button>
                <Button size="small" onClick={() => {
                    updateForm();
                    visible(true)
                }}>
                    {msgOk}
                </Button>
            </div>
        </div>
    )
})

const W = window.innerWidth;
const H = window.innerHeight;
const offset = 40;
const width = 520;
const height = 350;
const padding = 16;

const pos_x = W - padding - width;
const pos_y = padding + offset;

const params = (pos) => {
    const posX = pos ? pos.x : pos_x;
    const posY = pos ? pos.y : pos_y;

    const width_calc = pos ? pos.width : width;
    const height_calc = pos ? pos.height : height;

    const position = {
        x: posX,
        y: posY,
        width: width_calc,
        height: height_calc,
    }
    return position;
}

export const FilterLayer = observer(
    forwardRef<Element>((props, ref: RefObject<Element>) => {
        const { display, item, loads, visible } = props;

        useOutsideClick(ref?.current?.resizableElement, "z-index");

        const { getFields } = useSource();

        topics.subscribe("activePanel",
            (e) => { setActivePanel(e.detail); }
        );

        const [store] = useState(
            () => new FilterLayerStore({
                visible: visible,
                activePanel: display.panelsManager._activePanelKey && true,
                valueRnd: params(false),
                styleOp: {
                    minWidth: width,
                    minHeight: height,
                    collapse: false,
                }
            }));

        const {
            activeKey, setActiveKey,
            activePanel, setActivePanel,
            removeTab,
            styleOp, setStyleOp,
            valueRnd, setValueRnd,
        } = store;

        topics.subscribe("removeTabFilter",
            (e) => { removeTab(e.detail); }
        );

        const items = useMemo(() => {
            if (store.tabs.length) {
                const tabs: TabItems = [];
                for (const { component, props, ...rest } of store.tabs) {
                    const tab: TabItems[0] = {
                        closable: true,
                        ...rest,
                    };
                    tabs.push(tab);
                }
                return tabs;
            }
            return [];
        }, [store.tabs]);

        const openInFull = () => {
            setValueRnd(prev => ({
                ...prev,
                width: W - offset - padding * 2,
                height: H - offset - padding * 2,
                x: activePanel ? offset + padding : offset + padding,
                y: offset + padding
            }));
            setStyleOp(prev => ({
                ...prev,
                open_in_full: true,
            }));
        };

        const removeAllFilter = () => {
            setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
            setStyleOp(prev => ({
                ...prev,
                minWidth: width,
                minHeight: height,
                collapse: false,
            }));

            items.map(i => {
                removeTab(String(i.key));
                topics.publish("removeTabFilter", String(i.key));
                topics.publish("query.params_" + i.layerId, null)
            })
        };

        topics.subscribe("filter_show",
            () => { visible(false); }
        );

        const expand = (val) => {
            visible(false);
            setValueRnd(params(val));
            setStyleOp(prev => ({
                ...prev,
                minWidth: width,
                minHeight: height,
                collapse: false,
                open_in_full: false,
            }));
        };

        const operations = (
            <span className="op-button">
                <Button
                    type="text"
                    title={gettext("Remove all filter")}
                    onClick={removeAllFilter}
                    icon={<DeleteForever />}
                />
                <Button
                    type="text"
                    title={styleOp.open_in_full ? gettext("Close fullscreen") : gettext("Open in full")}
                    onClick={styleOp.open_in_full ? () => { expand(false) } : openInFull}
                    icon={styleOp.open_in_full ? <CloseFullscreen /> : <OpenInFull />}
                />
                <Button
                    type="text"
                    title={gettext("Collapse")}
                    onClick={() => { visible(true) }}
                    icon={<Minimize />}
                />
            </span>
        );

        useEffect(() => {
            if (items.length === 0) {
                setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
            }
        }, [items]);

        useEffect(() => {
            if (items.length === 0 || valueRnd.x < 0) {
                setValueRnd(params(false));
                setStyleOp(prev => ({
                    ...prev,
                    minWidth: width,
                    minHeight: height,
                    collapse: false,
                    open_in_full: false,
                }));
            } else {
                expand(valueRnd)
            }
            setActiveKey(String(item.id));

            getFields(item)
                .then(({ item, fields }) => {
                    store.addTab({
                        key: String(item.id),
                        label: item.label,
                        children: <ComponentFilter id={item.id} fields={fields} layerId={item.layerId} store={store} />
                    })
                });
        }, [loads]);

        return (
            createPortal(
                <Rnd
                    ref={ref}
                    onClick={() => ref.current.resizableElement.current.style.zIndex = 1}
                    resizeHandleClasses={{
                        right: "hover-right",
                        left: "hover-left",
                        top: "hover-top",
                        bottom: "hover-bottom",
                        bottomRight: "hover-angle-bottom-right",
                        bottomLeft: "hover-angle-bottom-left",
                        topRight: "hover-angle-top-right",
                        topLeft: "hover-angle-top-left",
                    }}
                    cancel=".ant-tabs-content-holder,.op-button"
                    bounds="window"
                    minWidth={styleOp.minWidth}
                    minHeight={styleOp.minHeight}
                    allowAnyClick={true}
                    enableResizing={true}
                    position={{ x: valueRnd.x, y: valueRnd.y }}
                    size={{ width: valueRnd.width, height: valueRnd.height }}
                    onDragStop={(e, d) => {
                        if (valueRnd.x !== d.x || valueRnd.y !== d.y) {
                            setValueRnd(prev => ({ ...prev, x: d.x, y: d.y }));
                        }
                    }}
                    onResize={(e, direction, ref, delta, position) => {
                        setValueRnd(prev => ({ ...prev, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y }));
                    }}
                >
                    <div className="ngw-filter-layer">
                        <Tabs
                            removeIcon={
                                <span title={gettext("Remove filter")}>
                                    <FilterAltOffIcon />
                                </span>
                            }
                            type="editable-card"
                            tabPosition="top"
                            size="small"
                            hideAdd
                            items={items}
                            activeKey={activeKey || undefined}
                            onChange={setActiveKey}
                            onEdit={(targetKey, action) => {
                                if (action === "remove") {
                                    topics.publish("removeTabFilter", String(targetKey));
                                    removeTab(String(targetKey));
                                }
                            }}
                            parentHeight
                            tabBarExtraContent={{ right: operations }}
                        />
                    </div>
                </Rnd >,
                document.body
            )
        );
    })
);