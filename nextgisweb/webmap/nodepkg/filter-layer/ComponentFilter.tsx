import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Form } from "@nextgisweb/gui/fields-form";
import { useRoute } from "@nextgisweb/pyramid/hook/useRoute";
import { route } from "@nextgisweb/pyramid/api";
import {
    Button,
    Card,
    DatePicker,
    DateTimePicker,
    Empty,
    Table,
    TimePicker,
    Input,
    Select,
} from "@nextgisweb/gui/antd";
import { topics } from "@nextgisweb/webmap/identify-module"

import BackspaceIcon from "@nextgisweb/icon/material/backspace";
import Remove from "@nextgisweb/icon/material/remove";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterPlusIcon from "@nextgisweb/icon/mdi/filter-plus";

import type { InputRef } from "@nextgisweb/gui/antd";
import type { NgwExtent } from "@nextgisweb/feature-layer/type/api";
import type { FeatureItem } from "@nextgisweb/feature-layer/type";

interface FeatureLayerQuery {
    limit?: number;
    geom?: boolean;
    extensions?: string[] | undefined;
    dt_format?: string;
}

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

import "./FilterLayer.less";

const msgAddFilterField = gettext("Add filter");
const msgRemoveFilterField = gettext("Remove filter");
const msgCancel = gettext("Cancel");
const msgOk = gettext("Ок");
const msgClearForm = gettext("Clean");
const msgApplyForm = gettext("Apply");
const msgZoomToFiltered = gettext("Zoom to filtered features");
const emptyFields = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)
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
        size: size,
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
}

export const ComponentFilter = observer((props) => {
    const { display, item, fields, refreshLayer, store } = props;
    const { activeKey, visible, removeTab } = store;
    const { layerId, styleId } = item;

    const [form] = Form.useForm();

    const [queryParams, setQueryParams] = useState();
    const [activeFields, setActiveFields] = useState();
    const [loadValue, setloadValue] = useState([]);

    useEffect(() => {
        topics.publish("query.params_" + styleId, queryParams);
    }, [queryParams]);

    const { route: extent, isLoading } = useRoute("feature_layer.feature.extent", {
        id: layerId,
    });

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

    const updateForm = () => {
        form
            .validateFields()
            .then((values) => {
                onFinish(values);
            });
    }

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

    const query: FeatureLayerQuery = {
        geom: false,
        extensions: [],
        limit: 10,
        dt_format: "iso",
    };


    const LoadValues = ({ activeFields }) => {
        const load = async (
            resourceId: number,
            field,
        ) => {
            const featureCollection = await route("feature_layer.feature.collection", resourceId).get({
                query,
            })
            const keyname = field.keyname;
            let result = featureCollection.map(a => a.fields).map(a => a[keyname]).filter(x => x);
            let data = result.reduce((a, v, index) => ([...a, {
                key: index,
                name: v,
            }]), []);
            setloadValue(data)
        };
        const columns = [
            {
                title: activeFields.keyname,
                dataIndex: activeFields.keyname,
                key: activeFields.keyname,
            },
        ];
        return (
            <div>
                {loadValue && <Table columns={columns} dataSource={loadValue} />}
                <Button onClick={() => {
                    load(layerId, activeFields)
                }}>Образец</Button>
            </div>
        )
    }


    return (
        <div key={styleId} className="component-filter">
            {fields.length > 0 ?
                (<>
                    <div className="form-filters">
                        <Card
                            className="card-filter-fields"
                            title="Поля"
                        >
                            <Form
                                form={form}
                                name={"ngw_filter_layer_" + styleId}
                                onFinish={onFinish}
                                autoComplete="off"
                            >
                                {fields.map((itm) => (
                                    <Form.List key={itm.keyname} name={itm.keyname}>
                                        {(field, { add, remove }) => (
                                            <div className="field-row">
                                                <Card
                                                    title={
                                                        <div className="field-add">
                                                            <span
                                                                title={itm.display_name}
                                                                className="title-field"
                                                            >
                                                                {itm.display_name}
                                                            </span>
                                                            <Button
                                                                icon={<FilterPlusIcon />}
                                                                title={msgAddFilterField}
                                                                size={size}
                                                                onClick={() => {
                                                                    add();
                                                                    setActiveFields(itm)
                                                                }}
                                                            />
                                                        </div>

                                                    }
                                                    size={size}
                                                    key={field.key}
                                                    className="card-row"
                                                >
                                                    {field.map(({ key, name, ...restField }) => (
                                                        <div className="card-content" key={key}>
                                                            <Form.Item noStyle {...restField} name={[name]} >
                                                                <FilterInput field={itm} />
                                                            </Form.Item>
                                                            <span
                                                                className="icon-symbol padding-icon"
                                                                title={msgRemoveFilterField}
                                                                onClick={() => {
                                                                    remove(name);
                                                                    setActiveFields(undefined)
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
                        </Card>
                        <Card
                            className="value-filter-fields"
                            title="Значения"
                        >
                            {activeFields && <LoadValues activeFields={activeFields} />}
                        </Card>
                    </div>
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
                            form.submit();
                            refreshLayer(item.key);
                        }}>
                            {msgApplyForm}
                        </Button>
                        <Button size={size} onClick={() => {
                            setQueryParams(null);
                            form.resetFields();
                            refreshLayer(item.key);
                        }}>
                            {msgClearForm}
                        </Button>
                        <Button size={size} onClick={() => {
                            setQueryParams(null);
                            topics.publish("query.params_" + styleId, null)
                            removeTab(activeKey)
                            topics.publish("removeTabFilter", activeKey);
                            refreshLayer(item.key);
                        }}>
                            {msgCancel}
                        </Button>
                        <Button size={size} onClick={() => {
                            updateForm();
                            refreshLayer(item.key);
                            visible(true)
                        }}>
                            {msgOk}
                        </Button>
                    </div>
                </>) :
                emptyFields}
        </div>
    )
});