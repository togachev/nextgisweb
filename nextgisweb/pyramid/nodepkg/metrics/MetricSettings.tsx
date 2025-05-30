import { isEqual } from "lodash-es";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import type { FC } from "react";
import { Balancer } from "react-wrap-balancer";

import { Button, Card, Dropdown, Tabs, message } from "@nextgisweb/gui/antd";
import { SaveButton } from "@nextgisweb/gui/component";
import { errorModal } from "@nextgisweb/gui/error";
import { useUnsavedChanges } from "@nextgisweb/gui/hook";
import type { Metrics } from "@nextgisweb/pyramid/type/api";

import { route } from "../api";
import { gettext } from "../i18n";
import { PageTitle } from "../layout";

import { registry } from "./tab";
import type { TabProps, TabValue } from "./tab";

import "./MetricSettings.less";

const msgAdd = gettext("Add");
const msgSuccess = gettext("The setting is saved.");
const msgSuccessReload = gettext("Reload the page to get them applied.");

// prettier-ignore
const msgInfo = [
    gettext("Add one or more counters to your Web GIS."),
    gettext("HTML code of these counters will be embeded into each page and will allow you to track user activity."),
];

const PlaceholderCard = () => (
    <Card size="small">
        <Balancer ratio={0.62}>{msgInfo.join(" ")}</Balancer>
    </Card>
);

type WidgetComponent = {
    [K in keyof Metrics]-?: FC<TabProps<K>>;
}[keyof Metrics];

export function MetricsSettings() {
    const [initial, setInitial] = useState<Metrics>();
    const [value, setValue] = useState<Metrics>();
    const [status, setStatus] = useState<string | null>("loading");
    const [activeTab, setActiveTab] = useState<string>();

    const tabs = useMemo(() => {
        return registry.queryAll().map(({ key, label, widget }) => {
            const Widget = lazy<WidgetComponent>(widget);
            const onChange = (value: TabValue | null) => {
                setValue((stateValue) => ({
                    ...stateValue,
                    ...{ [key]: value },
                }));
            };

            return {
                key,
                label,
                component: (props: Omit<TabProps, "onChange">) => (
                    <Suspense>
                        <Widget onChange={onChange} {...props} />
                    </Suspense>
                ),
            };
        });
    }, []);

    useEffect(() => {
        route("pyramid.csettings")
            .get({
                query: { pyramid: ["metrics"] },
            })
            .then((data) => {
                if (data.pyramid) {
                    setInitial(data.pyramid.metrics);
                    setValue(data.pyramid.metrics);
                    setStatus(null);
                }
            });
    }, []);

    const dirty = !isEqual(initial, value);
    useUnsavedChanges({ dirty });

    const [titems, aitems] = useMemo(() => {
        if (value === undefined) return [];

        const titems = [];
        const aitems = [];
        const readonly = status !== null;

        for (const { key, label, component: Component } of tabs) {
            const val = value[key];
            if (val !== undefined) {
                titems.push({
                    key: key,
                    label: label,
                    children: <Component value={val} readonly={readonly} />,
                });
            } else {
                aitems.push({ key, label });
            }
        }
        return [titems, aitems];
    }, [value, status, tabs]);

    const [messageApi, contextHolder] = message.useMessage();

    const add = (key: keyof Metrics) => {
        if (status !== null) return;
        setValue({ ...value, [key]: null });
        setActiveTab(key);
    };

    const remove = (key: keyof Metrics) => {
        if (status !== null) return;
        const newValue = { ...value };
        delete newValue[key];
        setValue(newValue);
        setActiveTab(undefined);
    };

    const save = async () => {
        setStatus("saving");
        try {
            const payload = Object.fromEntries(
                Object.entries(value || {}).filter(([, v]) => v)
            );

            await route("pyramid.csettings").put({
                json: { pyramid: { metrics: payload } },
            });

            setInitial(value);

            messageApi.open({
                type: "success",
                content: msgSuccess + " " + msgSuccessReload,
            });
        } catch (err) {
            errorModal(err);
        } finally {
            setStatus(null);
        }
    };

    return (
        <>
            {contextHolder}
            <PageTitle>
                {aitems && aitems.length > 0 && (
                    <Dropdown
                        menu={{
                            items: aitems,
                            onClick: ({ key }) => add(key as keyof Metrics),
                        }}
                        trigger={["click"]}
                    >
                        <Button type="primary" ghost>
                            {msgAdd}
                        </Button>
                    </Dropdown>
                )}
            </PageTitle>
            {titems && (
                <div className="ngw-pyramid-analytics-settings">
                    {titems.length === 0 ? (
                        <PlaceholderCard />
                    ) : (
                        <Tabs
                            type="editable-card"
                            items={titems && titems.length > 0 ? titems : []}
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            onEdit={(key, action) =>
                                action === "remove" &&
                                remove(String(key) as keyof Metrics)
                            }
                            hideAdd
                        />
                    )}
                    <div>
                        <SaveButton
                            disabled={!dirty}
                            loading={status === "saving"}
                            onClick={save}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

MetricsSettings.targetElementId = "main";
