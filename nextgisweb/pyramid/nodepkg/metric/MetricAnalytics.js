import "./MetricAnalytics.less";
import { Dropdown, Button, Tabs, Empty } from '@nextgisweb/gui/antd';
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { useEffect, useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { errorModal } from "@nextgisweb/gui/error";
import i18n from "@nextgisweb/pyramid/i18n";

const inputIdtext = i18n.gettext("Counter ID");
const yaLabel = i18n.gettext("Yandex.Metrica");
const glLabel = i18n.gettext("Google Analytics");
const select_a_counter = i18n.gettext("Select a counter");

const saveSuccesText = i18n.gettext("The setting is saved.");
const descEmpty = i18n.gettext("Add one or more counters to your page");

import { MetricForm } from "./metric-form";

const params = [
    { key: 'ya', label: yaLabel, tags: ['webvisor'] },
    { key: 'gl', label: glLabel, tags: [] },
];

export const MetricAnalytics = () => {
    const [activeKey, setActiveKey] = useState();
    const [itemsTabs, setItemsTabs] = useState([]);
    const [value, setValue] = useState([]);

    const model = 'pyramid.metric';
    const metric = 'metric_';

    const ContentTab = ({ tags, keyMetric }) => (
        <MetricForm
            keyMetric={keyMetric}
            model={model}
            settingName={metric + keyMetric}
            saveSuccesText={saveSuccesText}
            inputProps={{ placeholder: inputIdtext }}
            checkboxProps={{ tags: tags }}
        />
    )

    params.map(item => {
        const { data } = useRouteGet({ name: model }, { key: item.key });
        if (data && data[Object.keys(data)]) {
            const tab = value.find(e => {
                return e.key === item.key ? true : false
            });
            if (!tab) {
                setValue([
                    ...value,
                    {
                        label: item.label,
                        key: item.key,
                        children: <ContentTab tags={item.tags} keyMetric={item.key} />
                    },
                ]);
            }
        }
    })

    useEffect(() => {
        setItemsTabs(value);
    }, [value])

    const propsMenu = {
        items: params,
        onClick: (item) => {
            const tab = itemsTabs.find(e => {
                return e.key === item.key ? true : false
            });
            if (!tab) {
                setActiveKey(item.key);
                const paramsItem = params.find(e => e.key === item.key);
                setItemsTabs([
                    ...itemsTabs,
                    {
                        label: paramsItem.label,
                        key: item.key,
                        children: <ContentTab tags={paramsItem.tags} keyMetric={item.key} />
                    },
                ]);
            }
        }
    };

    const onChange = (key) => {
        setActiveKey(key);
    };

    const removeMetric = async (key) => {
        try {
            const json = { [metric + key]: null };
            await route(model, key).put({
                json
            });
        } catch (err) {
            errorModal(err);
        }
    };

    const remove = (targetKey) => {
        const targetIndex = itemsTabs.findIndex((pane) => pane.key === targetKey);
        const newPanes = itemsTabs.filter((pane) => pane.key !== targetKey);
        if (newPanes.length && targetKey === activeKey) {
            const { key } = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex];
            setActiveKey(key);
        }
        setItemsTabs(newPanes);
    };

    const onEdit = (targetKey, action) => {
        if (action === 'remove') {
            remove(targetKey);
            removeMetric(targetKey)
        }
    };

    return (
        <div>
            <Tabs
                tabBarExtraContent={{
                    left:
                        <div style={{ margin: '0 5px 2px 0' }} >
                            <Dropdown menu={propsMenu} trigger={['click']}>
                                <Button type="primary">{select_a_counter}</Button>
                            </Dropdown>
                        </div>
                }}
                hideAdd
                onChange={onChange}
                activeKey={activeKey}
                type="editable-card"
                onEdit={onEdit}
                items={itemsTabs}
            />
            {!itemsTabs.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={descEmpty} /> : null}
        </div>
    );
};