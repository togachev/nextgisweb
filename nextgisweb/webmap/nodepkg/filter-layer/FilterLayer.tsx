import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, Tabs } from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import { FilterLayerStore } from "./FilterLayerStore";
import Minimize from "@nextgisweb/icon/material/minimize";

import FilterIcon from "@nextgisweb/icon/material/filter_alt";
import Close from "@nextgisweb/icon/material/close/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import OpenInFull from "@nextgisweb/icon/material/open_in_full/outline";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen/outline";

import type { ParamOf } from "@nextgisweb/gui/type";
import type { ResourceItem } from "@nextgisweb/resource/type/Resource";
type TabItems = NonNullable<ParamOf<typeof Tabs, "items">>;

import { topics } from "@nextgisweb/webmap/identify-module"

import "./FilterLayer.less";

const ComponentTest = ({ label }) => {
    return (
        <div className="filter-content">Форма с фильтром для {label}</div>
    )
}

const offset = 40;
const params = (activePanel, collapse) => {
    const posX = collapse ?
        activePanel ? 16 + 6 + 30 + 350 + offset : 16 + 6 + 30 + offset :
        window.innerWidth / 2 - window.innerWidth / 100 * 50 / 2;

    const posY = collapse ? 17 + offset :
        window.innerHeight / 2 - window.innerHeight / 100 * 50 / 2;

    const width = collapse ? 30 : "50%";
    const height = collapse ? 30 : "50%";
    const position = {
        x: posX,
        y: posY,
        width: width,
        height: height,
    }
    return position;
}

export default observer(
    function FilterLayer(props) {
        const { display, item, loads } = props;

        const [fields, setFields] = useState();
        const [activePanel, setActivePanel] = useState(display.panelsManager._activePanelKey && true);

        topics.subscribe("activePanel",
            async (e) => {
                setActivePanel(e.detail);
            }
        );


        const [store] = useState(
            () => new FilterLayerStore({
                valueRnd: params(activePanel, false),
                styleOp: {
                    minWidth: "50%",
                    minHeight: "50%",
                    collapse: false,
                }
            }));

        const {
            activeKey, setActiveKey, removeTab,
            setValueRnd,
            valueRnd,
            styleOp,
            setStyleOp,
        } = store;


        topics.subscribe("removeTabFilter",
            async (e) => {
                removeTab(e.detail);
            }
        );

        const { data: resourceData } = useRouteGet<ResourceItem>(
            "resource.item",
            { id: item?.layerId },
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
            setStyleOp(prev => ({
                ...prev,
                minWidth: "50%",
                minHeight: "50%",
                collapse: false,
            }));
        };

        const openInFull = () => {
            setValueRnd(prev => ({ ...prev, width: window.innerWidth - offset, height: window.innerHeight - offset, x: offset, y: offset }));
            setStyleOp(prev => ({
                ...prev,
                open_in_full: true,
            }));
        };

        const clearAllFilter = () => {
            setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
            setStyleOp(prev => ({
                ...prev,
                minWidth: "50%",
                minHeight: "50%",
                collapse: false,
            }));

            items.map(i => {
                removeTab(String(i.key));
                topics.publish("removeTabFilter", String(i.key));
            })
        };

        const collapse = () => {
            setValueRnd(params(activePanel, true));
            setStyleOp(prev => ({
                ...prev,
                minWidth: 30,
                minHeight: 30,
                collapse: true,
            }));
        };

        const expand = () => {
            setValueRnd(params(activePanel, false));
            setStyleOp(prev => ({
                ...prev,
                minWidth: "50%",
                minHeight: "50%",
                collapse: false,
                open_in_full: false,
            }));
        };

        const operations = (
            <span className={styleOp.collapse ? "op-button-collapse" : "op-button"}>
                {styleOp.collapse ?
                    <Button
                        icon={<FilterIcon />}
                        type="text"
                        title={gettext("Filter layers")}
                        onClick={expand}
                    /> :
                    <>
                        <Button
                            disabled={styleOp.collapse ? true : false}
                            type="text"
                            title={gettext("Collapse")}
                            onClick={collapse}
                            icon={<Minimize />}
                        />
                        {
                            styleOp.open_in_full ?
                                <Button
                                    type="text"
                                    title={gettext("Close fullscreen")}
                                    onClick={expand}
                                    icon={<CloseFullscreen />}
                                />
                                :
                                <Button
                                    type="text"
                                    title={gettext("Open in full")}
                                    onClick={openInFull}
                                    icon={<OpenInFull />}
                                />
                        }
                        <Button
                            type="text"
                            title={gettext("Clear all filter")}
                            onClick={clearAllFilter}
                            icon={<DeleteForever />}
                        />
                        <Button
                            type="text"
                            title={gettext("Close")}
                            onClick={close}
                            icon={<Close />}
                        />
                    </>
                }
            </span>
        );

        useEffect(() => {
            setValueRnd(params(activePanel, styleOp.collapse));
        }, [activePanel]);

        useEffect(() => {
            if (items.length === 0) {
                return close()
            }
        }, [items]);

        useEffect(() => {
            if (items.length === 0 || valueRnd.x < 0) {
                setValueRnd(params(activePanel, false));
            } else {
                expand()
            }
            setActiveKey(item.layerId);

            store.addTab({
                key: String(item.layerId),
                label: item.label,
                children: <ComponentTest label={item.label} operations={operations} />
            })

        }, [loads]);

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
                    cancel=".ant-tabs-content-holder,.op-button-collapse,.op-button"
                    bounds="window"
                    minWidth={styleOp.minWidth}
                    minHeight={styleOp.minHeight}
                    allowAnyClick={true}
                    enableResizing={styleOp.collapse ? false : true}
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
                    <div className="ngw-filter-layer">
                        <Tabs
                            type="editable-card"
                            tabPosition="top"
                            size="small"
                            hideAdd
                            items={styleOp.collapse ? null : items}
                            activeKey={activeKey || undefined}
                            onChange={setActiveKey}
                            onEdit={(targetKey, action) => {
                                if (action === "remove") {
                                    topics.publish("removeTabFilter", String(targetKey));
                                    removeTab(String(targetKey));
                                }
                            }}
                            parentHeight
                            tabBarExtraContent={{ right: operations }}
                        />
                    </div>
                </Rnd >,
                document.body
            )
        );
    }
);