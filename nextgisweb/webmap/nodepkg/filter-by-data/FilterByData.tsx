import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
    Button,
    DatePicker,
    DateTimePicker,
    TimePicker,
    Input,
    InputBigInteger,
    InputInteger,
    InputNumber,
    Modal,
    Select,
    Space,
} from "@nextgisweb/gui/antd";

import { gettext } from "@nextgisweb/pyramid/i18n";
import { topics } from "@nextgisweb/webmap/identify-module"
import { Form } from "@nextgisweb/gui/fields-form";

import Add from "@nextgisweb/icon/material/add";
import DeleteForever from "@nextgisweb/icon/material/delete_forever";
import type { FeatureGridStore } from "@nextgisweb/feature-layer/feature-grid/FeatureGridStore";

import "./FilterByData.less";

const msgCancel = gettext("Cancel");
const msgOk = gettext("Ок");
const msgClearForm = gettext("Clean");
const msgCheckForm = gettext("Check");

import type { SelectProps } from "@nextgisweb/gui/antd";

interface FilterByDataProps {
    id: number;
    store: FeatureGridStore;
}

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

const operator = {
    eq: { label: 'равно', value: 'eq' },
    in: { label: 'массив', value: 'in' },
    ne: { label: 'не равно', value: 'ne' },
    lt: { label: 'меньше', value: 'lt' },
    gt: { label: 'больше', value: 'gt' },
    le: { label: 'меньше или равно', value: 'le' },
    ge: { label: 'больше или равно', value: 'ge' },
    like: { label: 'like', value: 'like' },
    ilike: { label: 'ilike', value: 'ilike' },
};

const op_type = {
    string: ['like', 'ilike', 'ne', 'eq', 'in'],
    number: ['eq', 'in', 'ne', 'lt', 'gt', 'le', 'ge'],
};

const DATE_TYPE = ["DATETIME", "DATE", "TIME"];
const NUMBER_TYPE = ["REAL", "INTEGER", "BIGINT"];

const type_comp = (value, props) => {
    const inputComp = {
        STRING: <Input {...props} />,
        REAL: <InputNumber {...props} />,
        INTEGER: <InputInteger {...props} />,
        BIGINT: <InputBigInteger {...props} />,
        DATETIME: <DateTimePicker {...props} />,
        DATE: <DatePicker {...props} />,
        TIME: <TimePicker {...props} />,
    }
    return inputComp[value];
}

export const FilterByData = observer(({
    id,
    store,
}: FilterByDataProps) => {

    const { fields, setStartFilter, modalFilter, setModalFilter, setQueryParams, queryParams } = store;

    const options: SelectProps['options'] = [];

    fields.map((x) => {
        options.push({ id: x.id, key: x.keyname, title: x.display_name, checked: false, datatype: x.datatype });
    });

    const [opInt, setOpInt] = useState({ 0: operator.eq });
    const [opStr, setOpStr] = useState({ 0: operator.ilike });
    const [form] = Form.useForm();

    useEffect(() => {
        topics.publish("query.params_" + id, queryParams);
    }, [queryParams]);

    const onChangeSelect = (e: SelectProps, key) => {
        if (e === undefined) {
            setOpInt((prev) => ({
                ...prev,
                [key]: operator.eq
            }));
        } else {
            setOpInt((prev) => ({
                ...prev,
                [key]: operator[e]
            }));
        }
    };

    const onChangeSelectStr = (e: SelectProps, key) => {
        if (e === undefined) {
            setOpStr((prev) => ({
                ...prev,
                [key]: operator.ilike
            }));
        } else {
            setOpStr((prev) => ({
                ...prev,
                [key]: operator[e]
            }));
        }
    };

    const onFinish = (values: any) => {
        const params = values.params;
        const keys_ = Object.keys(params || {});
       
        let obj: object = {};

        getEntries(fields).map(([key, value], idx) => {
            if (keys_.includes(value.keyname)) {
                const field = params[value.keyname];

                if (field && DATE_TYPE.includes(value.datatype)) {
                    Object.keys(opInt)?.map((i, index) => {
                        let val_ = opInt[i].value ? "__" + opInt[i].value : "";
                        let vf
                        if (!field[index]) {
                            return
                        }
                        if (value.datatype === "TIME") {
                            vf = field[index].format('H:m:s')
                        } else if (value.datatype === "DATE") {
                            vf = field[index].format('YYYY-MM-DD')
                        } else if (value.datatype === "DATETIME") {
                            vf = field[index].format('YYYY-MM-DD H:m:s')
                        }

                        vf && Object.assign(obj, {
                            [idx + index + ":" + "fld_" + value.keyname + val_]: vf
                        });
                    });
                }
                else if (field && value.datatype === "STRING") {
                    Object.keys(opStr)?.map((i, index) => {
                        let val_ = opStr[i].value ? "__" + opStr[i].value : "";
                        let opt_ = "";
                        if (!field[index]) {
                            return
                        }
                        if (['like', 'ilike'].includes(opStr[i].value)) {
                            opt_ = "%"
                        }
                        Object.assign(obj, {
                            [idx + index + ":" + "fld_" + value.keyname + val_]: opt_ + field[index] + opt_
                        });
                    });
                }
                else if (field !== undefined && NUMBER_TYPE.includes(value.datatype)) {
                    Object.keys(opInt)?.map((i, index) => {
                        let val_ = opInt[i].value ? "__" + opInt[i].value : "";
                        if (!field[index]) {
                            return
                        }
                        Object.assign(obj, {
                            [idx + index + ":" + "fld_" + value.keyname + val_]: field[index]
                        });
                    });
                }
            }
        });

        Object.keys(obj).length > 0 && setQueryParams((prev) => ({
            ...prev,
            fld_field_op: obj,
        }))
    };

    const updateForm = () => {
        form
            .validateFields()
            .then((values) => {
                onFinish(values);
            })
    }

    return (
        <Modal
            maskClosable={true}
            open={modalFilter}
            onOk={() => {
                setModalFilter(false);
            }}
            onCancel={() => {
                setModalFilter(false);
            }}
            closable={false}
            cancelButtonProps={{ style: { display: 'none' } }}
            okButtonProps={{ style: { display: 'none' } }}
        >
            <div className="modal-filters">

                <Form
                    form={form}
                    name="dynamic_form_nest_item"
                    onFinish={onFinish}
                    style={{ maxWidth: 600 }}
                    autoComplete="off"
                >
                    <Form.List name="params" >
                        {() => (<>
                            {fields.map(({ keyname, display_name, datatype }) => {
                                return (
                                    <Space key={keyname} align="baseline">
                                        {DATE_TYPE.includes(datatype) && (<>
                                            <Form.List name={keyname}>
                                                {(_array, { add, remove }) => (
                                                    <>
                                                        {_array.map(({ key, name, ...rest }) => (
                                                            <Space key={key} align="baseline">
                                                                <Form.Item title={display_name} {...rest} name={[name]}>
                                                                    {type_comp(datatype, { placeholder: display_name })}
                                                                </Form.Item>
                                                                <Select
                                                                    allowClear
                                                                    showSearch
                                                                    style={{ width: 200 }}
                                                                    placeholder="Операторы"
                                                                    defaultValue={operator.eq}
                                                                    onChange={(e) => {
                                                                        onChangeSelect(e, key);
                                                                    }}
                                                                    filterOption={true}
                                                                    options={op_type.number.filter((i) => i !== "in").map((item) => {
                                                                        return operator[item];
                                                                    })}
                                                                />
                                                                <DeleteForever
                                                                    onClick={() => {
                                                                        delete opInt[rest.fieldKey];
                                                                        remove(name);
                                                                        const substring = rest.fieldKey + ":fld_" + keyname
                                                                        updateForm()
                                                                    }}
                                                                />
                                                            </Space>
                                                        ))}
                                                        <Form.Item>
                                                            <Button
                                                                type="dashed"
                                                                onClick={() => {
                                                                    add();
                                                                    if (_array.length > 0) {
                                                                        setOpInt((prev) => ({
                                                                            ...prev,
                                                                            [_array.slice(-1)[0].fieldKey + 1]: operator.eq
                                                                        }));
                                                                    } else {
                                                                        setOpInt((prev) => ({
                                                                            ...prev,
                                                                            0: operator.eq
                                                                        }));
                                                                    }
                                                                }}
                                                                block
                                                                icon={<Add />}
                                                            >
                                                                Добавить фильтр для поля: {keyname}
                                                            </Button>
                                                        </Form.Item>
                                                    </>
                                                )}
                                            </Form.List>
                                        </>)}
                                        {NUMBER_TYPE.includes(datatype) && (
                                            <Form.List name={keyname}>
                                                {(_array, { add, remove }) => (
                                                    <>
                                                        {_array.map(({ key, name, ...rest }) => (
                                                            <Space key={key} align="baseline">
                                                                <Form.Item title={display_name} {...rest} name={[name]}>
                                                                    {type_comp(datatype, { placeholder: display_name, style: { width: 200 } })}
                                                                </Form.Item>
                                                                <Select
                                                                    allowClear
                                                                    showSearch
                                                                    style={{ width: 200 }}
                                                                    placeholder="Операторы"
                                                                    defaultValue={operator.eq}
                                                                    onChange={(e) => {
                                                                        onChangeSelect(e, key);
                                                                    }}
                                                                    options={op_type.number.map((item) => {
                                                                        return operator[item];
                                                                    })}
                                                                />
                                                                <DeleteForever
                                                                    onClick={() => {
                                                                        delete opInt[rest.fieldKey];
                                                                        remove(name);
                                                                        updateForm()
                                                                    }}
                                                                />
                                                            </Space>
                                                        ))}
                                                        <Form.Item>
                                                            <Button
                                                                type="dashed"
                                                                onClick={() => {
                                                                    add();
                                                                    if (_array.length > 0) {
                                                                        setOpInt((prev) => ({
                                                                            ...prev,
                                                                            [_array.slice(-1)[0].fieldKey + 1]: operator.eq
                                                                        }));
                                                                    } else {
                                                                        setOpInt((prev) => ({
                                                                            ...prev,
                                                                            0: operator.eq
                                                                        }));
                                                                    }
                                                                }}
                                                                block
                                                                icon={<Add />}
                                                            >
                                                                Добавить фильтр для поля: {keyname}
                                                            </Button>
                                                        </Form.Item>
                                                    </>
                                                )}
                                            </Form.List>
                                        )}
                                        {datatype === "STRING" && (
                                            <Form.List name={keyname}>
                                                {(_array, { add, remove }) => (
                                                    <>
                                                        {_array.map(({ key, name, ...rest }) => (
                                                            <Space key={key} align="baseline">
                                                                <Form.Item title={display_name} {...rest} name={[name]}>
                                                                    {type_comp(datatype, { placeholder: display_name })}
                                                                </Form.Item>
                                                                <Select
                                                                    showSearch
                                                                    style={{ width: 200 }}
                                                                    placeholder="Операторы"
                                                                    defaultValue={operator.ilike}
                                                                    onChange={(e) => {
                                                                        onChangeSelectStr(e, key)
                                                                    }}
                                                                    options={
                                                                        op_type.string.map(item => {
                                                                            return operator[item];
                                                                        })
                                                                    }
                                                                />
                                                                <DeleteForever
                                                                    onClick={() => {
                                                                        delete opStr[rest.fieldKey];
                                                                        remove(name);
                                                                        updateForm();
                                                                    }}
                                                                />
                                                            </Space>
                                                        ))}
                                                        <Form.Item>
                                                            <Button
                                                                type="dashed"
                                                                onClick={() => {
                                                                    add();
                                                                    if (_array.length > 0) {
                                                                        setOpStr((prev) => ({
                                                                            ...prev,
                                                                            [_array.slice(-1)[0].fieldKey + 1]: operator.ilike
                                                                        }));
                                                                    } else {
                                                                        setOpStr((prev) => ({
                                                                            ...prev,
                                                                            0: operator.ilike
                                                                        }));
                                                                    }
                                                                }}
                                                                block
                                                                icon={<Add />}
                                                            >
                                                                Добавить фильтр для поля: {keyname}
                                                            </Button>
                                                        </Form.Item>
                                                    </>
                                                )}
                                            </Form.List>
                                        )}
                                    </Space>
                                )
                            })}
                        </>)}
                    </Form.List>
                    <div className="control-filters">
                        <Button size="small" htmlType="submit">
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
                </Form>
            </div>
        </Modal>
    );
});
