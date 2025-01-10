import { forwardRef, RefObject, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, Tabs } from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import { topics } from "@nextgisweb/webmap/identify-module"
import { useOutsideClick } from "@nextgisweb/webmap/useOutsideClick";
import { useSource } from "./hook/useSource";

import { FilterLayerStore } from "./FilterLayerStore";
import { ComponentFilter } from "./ComponentFilter";

import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import FilterAltOffIcon from "@nextgisweb/icon/material/filter_alt_off";
import Minimize from "@nextgisweb/icon/material/minimize";
import OpenInFull from "@nextgisweb/icon/material/open_in_full/outline";

import "./FilterLayer.less";

import type { ParamOf } from "@nextgisweb/gui/type";

type TabItems = NonNullable<ParamOf<typeof Tabs, "items">>;

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];
const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

const size = "small"

const offset = 40;
const width = 600;
const height = 400;
const padding = 16;

const params = (pos) => {
    const posX = pos ? pos.x : window.innerWidth / 2 - width / 2;
    const posY = pos ? pos.y : padding + offset;

    const width_calc = pos ? pos.width : width;
    const height_calc = pos ? pos.height : height;

    const position = {
        x: posX,
        y: posY,
        width: width_calc,
        height: height_calc,
    }
    return position;
}

export const FilterLayer = observer(
    forwardRef<Element>((props, ref: RefObject<Element>) => {
        const { display, item, loads, visible } = props;

        useOutsideClick(ref?.current?.resizableElement, "z-index");

        const { getFields } = useSource();

        topics.subscribe("activePanel",
            (e) => { setActivePanel(e.detail); }
        );

        const [styleOp, setStyleOp] = useState({ minWidth: width, minHeight: height, collapse: false })

        const [store] = useState(
            () => new FilterLayerStore({
                visible: visible,
                activePanel: display.panelsManager._activePanelKey && true,
                valueRnd: params(false),
            }));

        const {
            activeKey, setActiveKey,
            activePanel, setActivePanel,
            removeTab,
            valueRnd, setValueRnd,
        } = store;

        topics.subscribe("removeTabFilter",
            (e) => { removeTab(e.detail); }
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

        const openInFull = () => {
            setValueRnd(prev => ({
                ...prev,
                width: window.innerWidth - offset - padding * 2,
                height: window.innerHeight - offset - padding * 2,
                x: activePanel ? offset + padding : offset + padding,
                y: offset + padding
            }));
            setStyleOp(prev => ({
                ...prev,
                open_in_full: true,
            }));
        };

        const refreshLayer = (key) => {
            display.map.layers[key].olSource.refresh();
        }

        const delQParams = (key) => {
            display.webmapStore.setQParam((prev) => {
                const qP = { ...prev };
                delete qP[key];
                return qP;
            })
        }

        const removeAllFilter = () => {
            setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
            setStyleOp(prev => ({
                ...prev,
                minWidth: width,
                minHeight: height,
                collapse: false,
            }));

            items.map(i => {
                refreshLayer(i.ikey);
                removeTab(String(i.key));
                topics.publish("removeTabFilter", String(i.key));
                topics.publish("query.params_" + i.styleId, { queryParams: null, nd: "204" });
                delQParams(i.styleId)
            })
        };

        topics.subscribe("filter_show",
            () => { visible(false); }
        );

        const expand = (val) => {
            visible(false);
            setValueRnd(params(val));
            setStyleOp(prev => ({
                ...prev,
                minWidth: width,
                minHeight: height,
                collapse: false,
                open_in_full: false,
            }));
        };

        const operations = (
            <span className="op-button">
                <Button
                    type="text"
                    title={gettext("Remove all filter")}
                    onClick={removeAllFilter}
                    icon={<DeleteForever />}
                />
                <Button
                    type="text"
                    title={styleOp.open_in_full ? gettext("Close fullscreen") : gettext("Open in full")}
                    onClick={styleOp.open_in_full ? () => { expand(false) } : openInFull}
                    icon={styleOp.open_in_full ? <CloseFullscreen /> : <OpenInFull />}
                />
                <Button
                    type="text"
                    title={gettext("Collapse")}
                    onClick={() => { visible(true) }}
                    icon={<Minimize />}
                />
            </span>
        );

        useEffect(() => {
            if (items.length === 0) {
                setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
            }
        }, [items]);

        useEffect(() => {
            if (items.length === 0 || valueRnd.x < 0) {
                setValueRnd(params(false));
                setStyleOp(prev => ({
                    ...prev,
                    minWidth: width,
                    minHeight: height,
                    collapse: false,
                    open_in_full: false,
                }));
            } else {
                expand(valueRnd)
            }
            setActiveKey(String(item.styleId));

            getFields(item)
                .then(({ item, fields }) => {
                    store.addTab({
                        key: String(item.styleId),
                        ikey: String(item.key),
                        label: item.label,
                        layerId: item.layerId,
                        styleId: item.styleId,
                        children: <ComponentFilter delQParams={delQParams} refreshLayer={refreshLayer} display={display} item={item} fields={fields} store={store} />
                    })
                });
        }, [loads]);



        return (
            createPortal(
                <Rnd
                    ref={ref}
                    onClick={() => ref.current.resizableElement.current.style.zIndex = 1}
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
                    cancel=".ant-tabs-content-holder,.ant-tabs-extra-content"
                    bounds="window"
                    minWidth={styleOp.minWidth}
                    minHeight={styleOp.minHeight}
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
                    <div className="ngw-filter-layer">
                        <Tabs
                            removeIcon={
                                <span title={gettext("Remove filter")}>
                                    <FilterAltOffIcon />
                                </span>
                            }
                            type="editable-card"
                            tabPosition="top"
                            size={size}
                            hideAdd
                            items={items}
                            activeKey={activeKey || undefined}
                            onChange={setActiveKey}
                            onEdit={(targetKey, action) => {
                                if (action === "remove") {
                                    topics.publish("removeTabFilter", String(targetKey));
                                    removeTab(String(targetKey));
                                    topics.publish("query.params_" + targetKey, { queryParams: null, nd: "204" });
                                    delQParams(targetKey)
                                    const key = getEntries(display.map.layers).find(([_, value]) => String(value?.itemConfig?.styleId) === targetKey)?.[0];
                                    refreshLayer(key);
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
    })
);