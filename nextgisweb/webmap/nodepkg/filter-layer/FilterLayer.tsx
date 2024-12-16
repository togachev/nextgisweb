import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
// import useVisible from "./useVisible";
import {
    Button,
    Tabs,
} from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import { FilterLayerStore } from "./FilterLayerStore";
import CloseIcon from "@nextgisweb/icon/material/close";
import Minimize from "@nextgisweb/icon/material/minimize";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import FilterIcon from "@nextgisweb/icon/material/filter_alt";

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

        /*скрытие окна при нажатии за его пределами*/
        // const { refs } = useVisible();

        const [fields, setFields] = useState();
        
        const [store] = useState(
            () => new FilterLayerStore({
                valueRnd: position,
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
            setStyleOp(prev => ({
                ...prev,
                minWidth: "50%",
                minHeight: "50%",
                collapse: false,
            }));
        };

        const collapse = () => {
            setValueRnd(prev => ({ ...prev, width: 138, height: 40, x: window.innerWidth - 138, y: 40 }));
            setStyleOp(prev => ({
                ...prev,
                minWidth: 138,
                minHeight: 40,
                collapse: true,
            }));
        };

        const expand = () => {
            setValueRnd(position);
            setStyleOp(prev => ({
                ...prev,
                minWidth: "50%",
                minHeight: "50%",
                collapse: false,
            }));
        };

        const operations = (
            <span className={styleOp.collapse ? "op-button-collapse" : "op-button"}>
                {styleOp.collapse && <span title={gettext("Filter layers")} className="icon-filter"><FilterIcon /></span>}
                <Button
                    disabled={styleOp.collapse ? true : false}
                    type="text"
                    title={gettext("Collapse")}
                    onClick={collapse}
                    icon={<Minimize />}
                />
                <Button
                    disabled={styleOp.collapse ? false : true}
                    type="text"
                    title={gettext("Expand")}
                    onClick={expand}
                    icon={<OpenInFull />}
                />
                <Button
                    type="text"
                    title={gettext("Close")}
                    onClick={close}
                    icon={<CloseIcon />}
                />
            </span>
        );

        useEffect(() => {
            if (items.length === 0) {
                return close()
            }
        }, [items]);

        useEffect(() => {
            if (items.length === 0 || valueRnd.x < 0) {
                setValueRnd(position);
            }

            setActiveKey(item.layerId);

            store.addTab({
                key: String(item.layerId),
                label: item.label,
                children: <ComponentTest label={item.label} />
            })

            /*скрытие окна при нажатии за его пределами*/
            // if (refs.current) {
            //     refs.current.hidden = false 
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
                    <div /*ref={refs}*/ /*скрытие окна при нажатии за его пределами*/ className="ngw-filter-layer">
                        <Tabs
                            type="editable-card"
                            hideAdd
                            items={styleOp.collapse ? null : items}
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
                </Rnd >,
                document.body
            )
        );
    }
);