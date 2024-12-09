import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import {
    Button,
    Card,
    DatePicker,
    DateTimePicker,
    TimePicker,
    Input,
    Modal,
    Select,
} from "@nextgisweb/gui/antd";

import { gettext } from "@nextgisweb/pyramid/i18n";
import { topics } from "@nextgisweb/webmap/identify-module"
import { Form } from "@nextgisweb/gui/fields-form";

import Remove from "@nextgisweb/icon/material/remove";
import BackspaceIcon from "@nextgisweb/icon/material/backspace";
import type { FeatureGridStore } from "@nextgisweb/feature-layer/feature-grid/FeatureGridStore";

import "./FilterByData.less";

const msgTitleFilter = gettext("Filter");
const msgAddFilterField = gettext("Add filter");
const msgRemoveFilterField = gettext("Remove filter");
const msgCancel = gettext("Cancel");
const msgOk = gettext("Ок");
const msgClearForm = gettext("Clean");
const msgCheckForm = gettext("Check");

interface FilterByDataProps {
    id: number;
    store: FeatureGridStore;
}

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

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

export const FilterByData = observer(({
    id,
    store,
}: FilterByDataProps) => {

    const { fields, setStartFilter, modalFilter, setModalFilter, setQueryParams, queryParams } = store;

    const [form] = Form.useForm();

    useEffect(() => {
        topics.publish("query.params_" + id, queryParams);
    }, [queryParams]);

    const onFinish = (values) => {

        const keys_ = Object.keys(values || {});
        let obj: object = {};
        getEntries(fields).map(([key, value], idx) => {
            if (keys_.includes(value.keyname)) {
                const field = values[value.keyname];

                field?.map((item, index) => {
                    if (!field[index]?.vals) {
                        setQueryParams(null)
                        return
                    };
                    let op = item?.vals ? "__" + item.op : ""; /* оператор */
                    let vf = field[index].vals; /* значение */
                    const opt_ = value.datatype === "STRING" && ["like", "ilike"].includes(item.op) ? "%" : ""; /* %like%, %ilike% */

                    if (value.datatype === "TIME") {
                        vf = field[index].vals.format("H:m:s")
                    } else if (value.datatype === "DATE") {
                        vf = field[index].vals.format("YYYY-MM-DD")
                    } else if (value.datatype === "DATETIME") {
                        vf = field[index].vals.format("YYYY-MM-DD H:m:s")
                    } else if (value.datatype === "DATETIME") {
                        vf = field[index].vals.format("YYYY-MM-DD H:m:s")
                    };
                    Object.assign(obj, {
                        [idx.toString() + index.toString() + ":" + "fld_" + value.keyname + op]: opt_ + vf + opt_
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
        <Modal
            style={{ padding: 0 }}
            styles={{ body: { overflowY: "auto", maxHeight: "calc(100vh - 206px)" } }}
            maskClosable={true}
            open={modalFilter}
            onOk={() => {
                setModalFilter(false);
            }}
            onCancel={() => {
                setModalFilter(false);
            }}
            closable={false}
            cancelButtonProps={{ style: { display: "none" } }}
            okButtonProps={{ style: { display: "none" } }}
            modalRender={(modal) => {
                return React.cloneElement(modal, {
                    style: { ...modal.props.style, ...{ padding: 16 } },
                });
            }}
            title={msgTitleFilter}
            footer={
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
                        setModalFilter(false);
                        setQueryParams(null);
                        setStartFilter(false);
                    }}>
                        {msgCancel}
                    </Button>
                    <Button size="small" onClick={() => {
                        updateForm();
                        setModalFilter(false);
                    }}>
                        {msgOk}
                    </Button>
                </div>
            }
        >
            <div className="modal-filters">
                <Form
                    form={form}
                    name="ngw_filter_layer"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    {fields.map((item) => (
                        <Form.List key={item.keyname} name={item.keyname}>
                            {(field, { add, remove }) => (
                                <div className="field-row">
                                    <Card
                                        title={
                                            <span
                                                className="title-button"
                                                title={msgAddFilterField}
                                                onClick={() => { add(); }}
                                            >
                                                {item.display_name}
                                            </span>
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
        </Modal >
    );
});