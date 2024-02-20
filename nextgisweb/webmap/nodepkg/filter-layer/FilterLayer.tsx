import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DatePicker, Modal, Checkbox, Input, Tooltip, Tree } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";
import { parseNgwAttribute, formatNgwAttribute } from "@nextgisweb/feature-layer/util/ngwAttributes";

import type { LayerItem } from "../type/TreeItems";
import type { SelectProps, TreeDataNode } from "@nextgisweb/gui/antd";
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
    const treeData: TreeDataNode[] = [];
    fields.map((x) => {
        options.push({ id: x.id, key: x.keyname, title: x.display_name, checked: false, datatype: x.datatype });
    });
    fields.map((x) => {
        treeData.push({ title: x.display_name, key: x.keyname });
    });

    const [openModal, setOpenModal] = useState(true);
    const [openRangePicker, setOpenRangePicker] = useState();
    const [changeRP, setChangeRP] = useState<boolean>(false);
    const [currentRangeOption, setCurrentRangeOption] = useState<string>({});
    const [data, setData] = useState<any[]>(options)
    const [statusRG, setStatusRG] = useState<boolean>(false);

    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

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

    const onChange = (item) => {
        setData(data.map(e => e.id === item.id ? { ...e, checked: !item.checked } : e));
    }

    const onSelect = (selectedKeysValue: React.Key[], info: any) => {
        console.log("onSelect", info);
        setSelectedKeys(selectedKeysValue);
    };

    return (
        <Modal
            className="filter-layer-modal"
            maskClosable={false}
            open={openModal}
            onOk={() => {
                setOpenModal(false);

                console.log(store.inputData);
                store.inputData ?
                    Object.keys(store.inputData).map(id => {
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
            <Tree
                switcherIcon={false}
                onSelect={onSelect}
                selectedKeys={selectedKeys}
                treeData={treeData}
            />
        </Modal>
    );
}

// setData(data.map(e => e.id === item.id ? { ...e, checked: !item.checked } : e));