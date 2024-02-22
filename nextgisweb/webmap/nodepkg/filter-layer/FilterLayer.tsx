import React, { useCallback, useEffect, useMemo, useState, Dispatch } from 'react';
import { Button, DatePicker, Form, Modal, Checkbox, Input, InputNumber, Select, Space, Tooltip, Radio } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";
import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

import FilterIcon from "@nextgisweb/icon/material/filter_alt";

import type { LayerItem } from "../type/TreeItems";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/feature-grid/type";
import type WebmapStore from "../store";
import type {
    DojoTopic,
} from "../panels-manager/type";

import "./FilterLayer.less";

import type { GetProps, RadioChangeEvent, SelectProps } from "@nextgisweb/gui/antd";

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { RangePicker } = DatePicker;
const dt = '1970-01-01';
const dataType = ["DATE", "DATETIME"]
const { TextArea } = Input;
const msgRangePicker = gettext("Select date range");

const operator = {
    no: { label: '', value: '' },
    eq: { label: 'равно', value: 'eq' },
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
    integer: ['eq', 'ne', 'lt', 'gt', 'le', 'ge'],
}

export function FilterLayer({
    item,
    fields,
    plugin,
    topic,
    store,
}: {
    item: LayerItem;
    fields: FeatureLayerField;
    plugin: Record<string, unknown>;
    topic: DojoTopic;
    store: WebmapStore;
}) {
    const { layerId } = item;
    const options: SelectProps['options'] = [];
    
    fields.map((x) => {
        options.push({ id: x.id, key: x.keyname, title: x.display_name, checked: false, datatype: x.datatype });
    });

    const [openModal, setOpenModal] = useState(true);
    const [openRangePicker, setOpenRangePicker] = useState();
    const [changeRP, setChangeRP] = useState<boolean>(false);
    const [currentRangeOption, setCurrentRangeOption] = useState<string>({});
    const [data, setData] = useState<any[]>(options)
    const [statusRG, setStatusRG] = useState<boolean>(false);

    const [values, setValues] = useState();

    useMemo(() => {
        if (store.startDate && Object.keys(store.startDate).length > 0) {
            console.log(1);

        }
    }, [openRangePicker]);

    useEffect(() => {
        if (openModal === false) {
            setTimeout(async () => {
                return plugin._destroyComponent()
            });
        }
    }, [openModal])

    const startValue = useCallback(async (value, datatype) => {
        const query = { geom: 'no', extensions: 'no', order_by: value, ["fld_" + value + "__ne"]: dt }
        const items = await route('feature_layer.feature.collection', layerId).get({ query });
        const date = [items[0].fields[value], items.at(-1).fields[value]];
        setCurrentRangeOption(value)

        store.setStartDate((prev) => ({
            ...prev,
            [value]: [parseNgwAttribute(datatype, date[0]), parseNgwAttribute(datatype, date[1])],
        }));
    }, [])

    useMemo(() => {
        if (changeRP && store.currentDate) {
            let params = {
                resourceId: layerId,
                keyname: currentRangeOption,
                ["fld_" + currentRangeOption + "__ge"]: formatNgwAttribute(store.dataType, store.currentDate[currentRangeOption][0]),
                ["fld_" + currentRangeOption + "__le"]: formatNgwAttribute(store.dataType, store.currentDate[currentRangeOption][1]),
            }

            store.setQueryParams((prev) => ({
                ...prev,
                fld_field_op: params,
            }));
        }
    }, [changeRP]);

    const disabledDate: RangePickerProps['disabledDate'] = (current) => {
        if (store.startDate) {
            let endDate = store.dataType === "DATETIME" ? store.startDate[currentRangeOption][1] : store.startDate[currentRangeOption][1].add(1, 'day');
            return current && current < store.startDate[currentRangeOption][0] || current && current > endDate;
        }
    };

    const onOpenChangeRange = (open) => {
        setOpenRangePicker(open);
    }

    const onChangeRangePicker = (item) => {
        if (item) {
            store.setCurrentDate((prev) => ({
                ...prev,
                [currentRangeOption]: item,
            }));
            setChangeRP(true)

        } else {
            store.setCurrentDate((prev) => ({
                ...prev,
                [currentRangeOption]: null,
            }));
            store.setQueryParams(undefined)
            setChangeRP(false);
        }
    }

    const addAllObject = () => {
        // setValue(valueStart)
        setChangeRP(true)
    };

    const topicQueryParams = (params) => {
        topic.publish("query.params_" + layerId, params)
    }

    const [opStr, setOpStr] = useState(operator.ilike);
    const [opInt, setOpInt] = useState(operator.eq);

    const onChangeSelect = (e: SelectProps) => {
        console.log(e);
        
        if (e !== undefined) {
            setOpStr(operator[e])
            setOpInt(operator[e])
        } else {
            setOpStr(operator.ilike)
            setOpInt(operator.eq)
        }

    };


    const onFinish = (value) => {
        console.log(value);

        const keys_ = Object.keys(value.params || {})
        const values = {}

        fields.map((a) => {
            if (keys_.includes(a.keyname)) {
                console.log(value, a.keyname, opInt, opStr);
                const field = value.params[a.keyname];

                if (dataType.includes(a.datatype)) {
                    Object.assign(values, field ? {
                        ...value.fld_field_op,
                        ['fld_' + a.keyname + '__ge']: field[0].format('YYYY-MM-DD'),
                        ['fld_' + a.keyname + '__le']: field[1].format('YYYY-MM-DD'),
                    } : undefined)
                } else if (a.datatype === "STRING") {
                    let val_ = opStr.value !== '' ? "__" + opStr.value : ""
                    let opt_ = opStr.value !== '' ? opStr.opt : ""
                    Object.assign(values, field ? {
                        ...value.fld_field_op,
                        ['fld_' + a.keyname + val_]: opt_ + field + opt_,
                    } : undefined)
                } else if (a.datatype === "INTEGER") {
                    let val_ = opInt.value !== '' ? "__" + opInt.value : ""
                    Object.assign(values, field ? {
                        ...value.fld_field_op,
                        ['fld_' + a.keyname + val_]: field,
                    } : undefined)
                }
            }
        });
        store.setQueryParams((prev) => ({
            ...prev,
            fld_field_op: values,
        }));
        // тест RangePicker https://codepen.io/togachev/pen/OJqYQdy?editors=0011
    };

    return (
        <Modal
            maskClosable={false}
            open={openModal}
            onOk={() => {
                setOpenModal(false);
                topicQueryParams(store.queryParams)
            }}
            onCancel={() => {
                setOpenModal(false);
                topicQueryParams("");
                store.setQueryParams(null)
                store.setCurrentDate((prev) => ({
                    ...prev,
                    [currentRangeOption]: null,
                }));
            }}
        >
            <p>Filter layer content...</p>
            <div className="content-filters">
                <Form
                    name="dynamic_form_nest_item"
                    onFinish={onFinish}
                    style={{ maxWidth: 600 }}
                    autoComplete="off"
                >
                    <Form.List name="params">
                        {() => (
                            <>
                                {fields.map(({ keyname, display_name, datatype }) => (
                                    <Space key={keyname} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }} align="baseline">
                                        {dataType.includes(datatype) ?
                                            (
                                                <Form.Item name={keyname} label={display_name} >
                                                    <RangePicker />
                                                </Form.Item>
                                            )
                                            : (<></>)}
                                        {datatype === "INTEGER" ?
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
                                                        onChange={onChangeSelect}
                                                        options={
                                                            op_type.integer.map(item => {
                                                                return operator[item];
                                                            })
                                                        }
                                                    />

                                                </>
                                            ) : (<></>)}
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
                                                        onChange={onChangeSelect}
                                                        options={
                                                            op_type.string.map(item => {
                                                                return operator[item];
                                                            })
                                                        }
                                                    />
                                                </>

                                            ) : (<></>)}
                                    </Space>
                                ))}
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
}