import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useEffect, useState } from "react";
import {
    Button,
    DatePicker,
    Dropdown,
    RangePicker,
    DateTimePicker,
    Input,
    InputBigInteger,
    InputInteger,
    InputNumber,
    Modal,
    TimeRangePicker,
    Tooltip,
    Select,
    Space,
} from "@nextgisweb/gui/antd";

import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";
import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

import type { QueryParams } from "@nextgisweb/feature-layer/feature-grid/hook/useFeatureTable";
import type { SetValue } from "@nextgisweb/feature-layer/feature-grid/type";
import type { FormField, SizeType } from "@nextgisweb/gui/fields-form";
import type { FeatureLayerFieldRead } from "@nextgisweb/feature-layer/type/api";

import type { FeatureLayerDataType } from "@nextgisweb/feature-layer/type";
import type { DatePickerProps } from "@nextgisweb/gui/antd";
import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";
import FilterIcon from "@nextgisweb/icon/material/filter_alt";

import { topics } from "@nextgisweb/webmap/identify-module"

import { FieldsForm, Form } from "@nextgisweb/gui/fields-form";
import BackspaceIcon from "@nextgisweb/icon/material/backspace";
import Add from "@nextgisweb/icon/material/add";
import DeleteForever from "@nextgisweb/icon/material/delete_forever";
import type { FeatureGridStore } from "@nextgisweb/feature-layer/feature-grid/FeatureGridStore";

import "./FilterByData.less";

const style = { width: "100%" };

const msgAllInterval = gettext("Apply filter for entire interval");
const msgRangePicker = gettext("Select date range");
const msgAddFilter = gettext("Add filter");
const msgSetNull = gettext("Set field value to NULL (No data)");
const msgNoAttrs = gettext("There are no attributes in the vector layer");

const dt = '1970-01-01';

import type { GetProps, RadioChangeEvent, SelectProps } from "@nextgisweb/gui/antd";

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
    like: { label: 'like', value: 'like', opt: "%" },
    ilike: { label: 'ilike', value: 'ilike', opt: "%" },
};

const op_type = {
    string: ['like', 'ilike'],
    number: ['eq', 'in', 'ne', 'lt', 'gt', 'le', 'ge'],
}

const DATE_TYPE = ["DATETIME", "DATE", "TIME"]
const NUMBER_TYPE = ["REAL", "INTEGER", "BIGINT"]

export const FilterByData = observer(({
    id,
    store,
}: FilterByDataProps) => {

    const { fields, setStartDate, setStartFilter, setQueryParams, queryParams } = store;

    const options: SelectProps['options'] = [];

    fields.map((x) => {
        options.push({ id: x.id, key: x.keyname, title: x.display_name, checked: false, datatype: x.datatype });
    });

    const [openModal, setOpenModal] = useState(true);
    const [openRangePicker, setOpenRangePicker] = useState();
    const [changeRP, setChangeRP] = useState<boolean>(false);
    const [currentRangeOption, setCurrentRangeOption] = useState<string>({});
    const [opInt, setOpInt] = useState({ 0: operator.eq });
    const [opStr, setOpStr] = useState(operator.ilike);
    const form = Form.useForm()[0];

    const topicQueryParams = (params) => {
        topics.publish("query.params_" + id, params)
    }

    const startValue = useCallback(async (value, datatype) => {
        const query = { geom: 'no', extensions: 'no', order_by: value, ["fld_" + value + "__ne"]: dt }
        const items = await route('feature_layer.feature.collection', id).get({ query });
        const date = [items[0].fields[value], items.at(-1).fields[value]];
        setCurrentRangeOption(value)

        setStartDate((prev) => ({
            ...prev,
            [value]: [parseNgwAttribute(datatype, date[0]), parseNgwAttribute(datatype, date[1])],
        }));
    }, [])

    useMemo(() => {
        if (changeRP && store.currentDate) {
            let params = {
                resourceId: id,
                keyname: currentRangeOption,
                ["fld_" + currentRangeOption + "__ge"]: formatNgwAttribute(store.DATE_TYPE, store.currentDate[currentRangeOption][0]),
                ["fld_" + currentRangeOption + "__le"]: formatNgwAttribute(store.DATE_TYPE, store.currentDate[currentRangeOption][1]),
            }

            store.setQueryParams((prev) => ({
                ...prev,
                fld_field_op: params,
            }));
        }
    }, [changeRP]);

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

    const onChangeSelectStr = (e: SelectProps) => {
        if (e === undefined) {
            setOpStr(operator.ilike);
        } else {
            setOpStr(operator[e]);
        }
    };

    const onFinish = (values: any) => {

        const params = values.params
        const keys_ = Object.keys(params || {})
        let obj = {}

        getEntries(fields).map(([key, value]) => {
            if (keys_.includes(value.keyname)) {
                const field = params[value.keyname];

                if (field && DATE_TYPE.includes(value.datatype)) {
                    if (value.datatype !== "TIME") {
                        Object.assign(obj, {
                            ['fld_' + value.keyname + '__ge']: field[0].format('YYYY-MM-DD'),
                            ['fld_' + value.keyname + '__le']: field[1].format('YYYY-MM-DD'),
                        });
                    } else {
                        console.log(field);

                        Object.assign(obj, {
                            ['fld_' + value.keyname + '__ge']: field[0].format('HH:mm:ss'),
                            ['fld_' + value.keyname + '__le']: field[1].format('HH:mm:ss'),
                        });
                    }
                }
                else if (field && value.datatype === "STRING") {
                    let val_ = opStr.value !== '' ? "__" + opStr.value : ""
                    let opt_ = opStr.value !== '' ? opStr.opt : ""

                    Object.assign(obj, {
                        ["fld_" + value.keyname + val_]: opt_ + field + opt_
                    });
                }
                else if (field !== undefined && NUMBER_TYPE.includes(value.datatype)) {
                    Object.keys(opInt)?.map((i, index) => {
                        let val_ = opInt[i].value
                            ? "__" + opInt[i].value
                            : "";

                        Object.assign(obj, {
                            ["fld_" + value.keyname + val_]: field[index]
                        });
                    });
                }
            }
        });

        setQueryParams((prev) => ({
            ...prev,
            fld_field_op: obj,
        }))
    };

    return (
        <Modal
            maskClosable={true}
            open={openModal}
            onOk={() => {
                setOpenModal(false);
                topicQueryParams(queryParams)
            }}
            onCancel={() => {
                setOpenModal(false);
                setQueryParams(null);
                setStartFilter(false);
            }}
        >
            <div className="content-filters">
                <Form
                    form={form}
                    name="dynamic_form_nest_item"
                    onFinish={onFinish}
                    style={{ maxWidth: 600 }}
                    autoComplete="off"
                    initialValues={{ params: [{}] }}
                >
                    <Form.List name="params" >
                        {() => (
                            <>
                                {fields.map(({ keyname, display_name, datatype }) => (
                                    <Space key={keyname} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }} align="baseline">
                                        {DATE_TYPE.includes(datatype) ?
                                            (
                                                <Form.Item name={keyname} label={display_name} >
                                                    {datatype === "TIME" ? <TimeRangePicker /> : <RangePicker />}
                                                </Form.Item>
                                            )
                                            : (<></>)}
                                        {NUMBER_TYPE.includes(datatype) ? (
                                            <>
                                                <Form.List name={keyname}>
                                                    {
                                                        (intArray, { add, remove }) => (
                                                            <>
                                                                {intArray.map(({ key, name, ...rest }) => (
                                                                    <Space key={key} align="baseline">
                                                                        <Form.Item {...rest} name={[name]}>
                                                                            <Input />
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
                                                                            }}
                                                                        />
                                                                    </Space>
                                                                ))}
                                                                <Form.Item>
                                                                    <Button
                                                                        type="dashed"
                                                                        onClick={() => {
                                                                            add();
                                                                            if (intArray.length > 0) {
                                                                                setOpInt((prev) => ({
                                                                                    ...prev,
                                                                                    [intArray.slice(-1)[0].fieldKey + 1]: operator.eq
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
                                                        )
                                                    }
                                                </Form.List>
                                            </>
                                        ) : (
                                            <></>
                                        )}
                                        {datatype === "STRING" ?
                                            (
                                                <>
                                                    <Form.Item name={keyname} label={display_name} >
                                                        <Input />
                                                    </Form.Item>
                                                    <Select
                                                        allowClear
                                                        showSearch
                                                        style={{ width: 200 }}
                                                        placeholder="Операторы"
                                                        defaultValue={operator.ilike}
                                                        onChange={onChangeSelectStr}
                                                        options={
                                                            op_type.string.map(item => {
                                                                return operator[item];
                                                            })
                                                        }
                                                    />
                                                </>

                                            ) : (<></>)}
                                    </Space>
                                )
                                )}
                            </>
                        )}
                    </Form.List>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
});
