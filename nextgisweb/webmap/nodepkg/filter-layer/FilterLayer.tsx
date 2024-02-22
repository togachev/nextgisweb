import React, { useCallback, useEffect, useMemo, useState, Dispatch } from 'react';
import { Button, DatePicker, Form, Modal, Checkbox, Input, InputNumber, Select, Space, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";
import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

import FilterIcon from "@nextgisweb/icon/material/filter_alt";

import type { LayerItem } from "../type/TreeItems";
import type { SelectProps } from 'antd';
import type { FeatureLayerField } from "@nextgisweb/feature-layer/feature-grid/type";
import type WebmapStore from "../store";
import type {
    DojoTopic,
} from "../panels-manager/type";

import "./FilterLayer.less";

import type { GetProps } from "@nextgisweb/gui/antd";

type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

const { RangePicker } = DatePicker;
const dt = '1970-01-01';
const dataType = ["DATE", "DATETIME"]
const { TextArea } = Input;
const msgRangePicker = gettext("Select date range");

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

    const onFinish = (fieldsValue) => {
        console.log('Received values of form:', fieldsValue);
        // const rangeValue = fieldsValue['range-picker'];
        // const values = {
        //     ...fieldsValue,
        //     'range-picker': { 'start': rangeValue[0].format('YYYY-MM-DD'), 'end': rangeValue[0].format('YYYY-MM-DD') },
        // };

        // https://codepen.io/togachev/pen/OJqYQdy?editors=0011
    };

    const TestItem = ({ keyname }) => {
        return (
            <Form.Item name={keyname}>
                <RangePicker />
            </Form.Item>
        );
    };

    return (
        <Modal
            maskClosable={false}
            open={openModal}
            onOk={() => {
                setOpenModal(false);

                console.log(values);
                store.inputData ?
                    Object.keys(store.inputData).map(id => {
                        // store.setQueryParams({fld_field_op: store.inputData[id]})
                        console.log(id);

                    })
                    : null;
                console.log(store.queryParams);
                topicQueryParams(store.queryParams)

            }}
            onCancel={() => {
                setOpenModal(false);
                topicQueryParams("");
                store.setQueryParams(undefined)
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
                                    <Space key={keyname} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        {dataType.includes(datatype) ?
                                            (<TestItem keyname={keyname} />)
                                            :
                                            (<Form.Item
                                                name={keyname}
                                            >
                                                <Input placeholder={display_name} />
                                            </Form.Item>)}
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