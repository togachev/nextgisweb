import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import useVisible from "./useVisible";
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
import { FilterLayerStore } from "./FilterLayerStore";
import CloseIcon from "@nextgisweb/icon/material/close";

import type { ParamOf } from "@nextgisweb/gui/type";
import type { ResourceItem } from "@nextgisweb/resource/type/Resource";
type TabItems = NonNullable<ParamOf<typeof Tabs, "items">>;

import "./FilterLayer.less";

const ComponentTest = ({ label }) => {
    return (
        <div>{label}</div>
    )
}

export default observer(
    function FilterLayer(props) {
        const { item, position } = props;
        // const { refs } = useVisible(); /*скрытие окна при нажатии за его пределами*/

        const [fields, setFields] = useState();

        const [store] = useState(
            () => new FilterLayerStore({
                valueRnd: position,
            }));

        const {
            activeKey, setActiveKey, removeTab,
            setValueRnd,
            valueRnd,
        } = store;

        const { data: resourceData } = useRouteGet<ResourceItem>(
            "resource.item",
            { id: item.layerId },
            { cache: true },
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

        const close = () => {
            setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
        };

        const operations =
            <Button
                type="text"
                title={gettext("Close")}
                onClick={close}
                icon={<CloseIcon />}
            />;

        useEffect(() => {
            if (items.length === 0) {
                return close()
            }
        }, [items]);

        useEffect(() => {
            setValueRnd(position);
            setActiveKey(item.layerId);

            store.addTab({
                key: String(item.layerId),
                label: item.label,
                children: <ComponentTest label={item.label} />
            })

            // if (refs.current) {
            //     refs.current.hidden = false /*скрытие окна при нажатии за его пределами*/
            // }
        }, [position]);

        useEffect(() => {
            if (resourceData) {
                const featureLayer = resourceData.feature_layer!;
                const fields_ = featureLayer?.fields;
                if (fields_) {
                    setFields(fields_);
                }
            }
        }, [resourceData]);

        return (
            createPortal(
                <Rnd
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
                    cancel=""
                    bounds="window"
                    minWidth={600}
                    minHeight={600}
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
                    <div /*ref={refs}*/ /*скрытие окна при нажатии за его пределами*/ className="ngw-filter-layer">
                        <div className="filter-container">
                            <Tabs
                                type="editable-card"
                                hideAdd
                                items={items}
                                activeKey={activeKey || undefined}
                                onChange={setActiveKey}
                                onEdit={(targetKey, action) => {
                                    if (action === "remove") {
                                        removeTab(String(targetKey));
                                    }
                                }}
                                parentHeight
                                tabBarExtraContent={operations}
                            />
                        </div>
                    </div>
                </Rnd >,
                document.body
            )
        );
    }
);