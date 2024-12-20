import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useState } from "react";

import { Col, Row, Tree } from "@nextgisweb/gui/antd";
import type { TreeProps } from "@nextgisweb/gui/antd";

import type WebmapStore from "../store";
import type { TreeItem } from "../type/TreeItems";
import type { WebmapPlugin } from "../type/WebmapPlugin";
import type { DojoDisplay } from "../type";
import type { NgwExtent } from "@nextgisweb/feature-layer/type/FeatureExtent";

import { DropdownActions } from "./DropdownActions";
import { DropdownFile } from "./DropdownFile";
import { Legend } from "./Legend";
import { LegendAction } from "./LegendAction";
import { useDrag } from "./hook/useDrag";
import {
    keyInMutuallyExclusiveGroupDeep,
    // prepareWebMapItems,
    prepareWebMapItemsCustom,
    updateKeysForGroup,
    updateKeysForMutualExclusivity,
} from "./util/treeItems";

import FilterIcon from "@nextgisweb/icon/material/filter_alt";
import FilterAltOffIcon from "@nextgisweb/icon/material/filter_alt_off";
import { topics } from "@nextgisweb/webmap/identify-module"
import { gettext } from "@nextgisweb/pyramid/i18n";

import "./LayersTree.less";

type TreeNodeData = NonNullable<TreeProps["treeData"]>[0];

export type TreeWebmapItem = TreeNodeData & {
    key: number;
    children?: TreeWebmapItem[];
    legendIcon?: React.ReactNode;
    treeItem: TreeItem;
};

interface LayersTreeProps {
    store: WebmapStore;
    onSelect?: (keys: number[]) => void;
    setLayerZIndex: (id: number, zIndex: number) => void;
    getWebmapPlugins: () => Record<string, WebmapPlugin>;
    onReady?: () => void;
    onFilterItems?: (
        store: WebmapStore,
        layersItems: TreeWebmapItem[]
    ) => TreeWebmapItem[];
    showLegend?: boolean;
    showDropdown?: boolean;
    expandable?: boolean;
    checkable?: boolean;
    draggable?: boolean;
    selectable?: boolean;
    showLine?: boolean;
    display: DojoDisplay;
}

export const LayersTree = observer(
    ({
        store,
        onSelect,
        setLayerZIndex,
        getWebmapPlugins,
        onReady,
        onFilterItems,
        showLegend = true,
        showDropdown = true,
        checkable = true,
        expandable = true,
        draggable = true,
        selectable = true,
        showLine = true,
        display,
    }: LayersTreeProps) => {
        const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
        const [moreClickId, setMoreClickId] = useState<number>();
        const [fileClickId, setFileClickId] = useState<number>();
        const [update, setUpdate] = useState(false);
        const [filterKeys, setFilterKeys] = useState<object>();

        const [selectedId, setSelectedId] = useState<number[]>([]);
        const webmapItems = store.webmapItems;

        const { onDrop, allowDrop } = useDrag({ store, setLayerZIndex });

        const treeItems = useMemo(() => {
            // let _webmapItems = prepareWebMapItems(webmapItems);
            let _webmapItems = prepareWebMapItemsCustom(webmapItems);
            if (onFilterItems) {
                _webmapItems = onFilterItems(store, _webmapItems);
            }
            return _webmapItems;
        }, [webmapItems]);

        const hasGroups = useMemo(
            () => webmapItems.some((item) => item.type === "group"),
            [webmapItems]
        );

        useEffect(() => {
            if (onReady) {
                onReady();
            }
        }, [onReady]);

        const onExpand = (expandedKeysValue: React.Key[]) => {
            if (!expandable) return;
            store.setExpanded(expandedKeysValue.map(Number));
        };

        const onCheck: TreeProps<TreeWebmapItem>["onCheck"] = (
            checkedKeysValue,
            event
        ) => {
            const checkedItem = event.node;
            const checkedKeys = (
                Array.isArray(checkedKeysValue)
                    ? checkedKeysValue
                    : checkedKeysValue.checked
            ).map(Number);

            const mutuallyExclusiveParents = keyInMutuallyExclusiveGroupDeep(
                checkedItem.treeItem.key,
                treeItems.map((t) => t.treeItem)
            );

            let updatedCheckedKeys = checkedKeys;

            if (mutuallyExclusiveParents) {
                updatedCheckedKeys = updateKeysForMutualExclusivity(
                    checkedItem,
                    mutuallyExclusiveParents,
                    checkedKeys
                );
            } else if (checkedItem.treeItem.type === "group") {
                updatedCheckedKeys = updateKeysForGroup(
                    checkedItem,
                    checkedKeys,
                    store.checked
                );
            }

            store.handleCheckChanged(updatedCheckedKeys);
        };

        const _onSelect = (selectedKeysValue: React.Key[]) => {
            const val = selectedKeysValue.map(Number);
            setSelectedKeys(val);
            if (onSelect) onSelect(val);
        };

        topics.subscribe("removeTabFilter",
            async (e) => {
                setFilterKeys(prev => {
                    const state = { ...prev };
                    delete state[e.detail];
                    return state;
                });
            }
        );

        const titleRender = (nodeData: TreeWebmapItem) => {
            const { title, fileResourceVisible } = nodeData.treeItem;
            const shouldActions = showLegend || showDropdown;

            let actions;
            let actionsFile;
            if (shouldActions) {
                const dropdownAction = showDropdown && (
                    <DropdownActions
                        nodeData={nodeData.treeItem}
                        getWebmapPlugins={getWebmapPlugins}
                        setMoreClickId={setMoreClickId}
                        moreClickId={moreClickId}
                        update={update}
                        setUpdate={setUpdate}
                    />
                );
                const dropdownFile = showDropdown && fileResourceVisible && (
                    <DropdownFile
                        nodeData={nodeData.treeItem}
                        setFileClickId={setFileClickId}
                        fileClickId={fileClickId}
                    />
                );
                actions = (
                    <Col
                        className="tree-item-action"
                        style={{ alignItems: "center" }}
                    >
                        {dropdownAction}
                    </Col>
                );
                actionsFile = (
                    <Col
                        className="tree-item-action"
                        style={{ alignItems: "center" }}
                    >
                        {dropdownFile}
                    </Col>
                );
            }
            const legendAction = showLegend && (
                <LegendAction
                    nodeData={nodeData.treeItem}
                    onClick={() => setUpdate(!update)}
                />
            );

            const typeLayer = ["postgis_layer", "vector_layer"];
            const idNode = nodeData.treeItem.id
            const filtered = filterKeys && Object.entries(filterKeys).filter(([_, value]) => value === idNode)[0];

            const handleEnter = (id) => {
                setSelectedId(prev => [...prev, id]);
            };

            const handleLeave = (id) => {
                setSelectedId(prev => prev.filter(i => i !== id))
            };

            return (
                <>
                    <Row key={idNode} wrap={false} onMouseEnter={() => handleEnter(idNode)} onMouseLeave={() => handleLeave(idNode)}>
                        <Col flex="auto" className="tree-item-title">
                            {legendAction}
                            <div className="legend-title">{title}</div>
                        </Col>
                        {actionsFile}
                        {typeLayer.includes(nodeData.treeItem.layerCls) && (<>
                            {selectedId.includes(idNode) ?
                                <>
                                    {filtered ?
                                        <span title={gettext("Delete filter")} className="more"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                topics.publish("removeTabFilter", filtered[0]);
                                                topics.publish("button_hidden");
                                                setSelectedId(prev => prev.filter(i => i !== idNode))
                                                setFilterKeys(prev => {
                                                    const state = { ...prev };
                                                    delete state[filtered[0]];
                                                    return state;
                                                });
                                            }}>
                                            <FilterAltOffIcon />
                                        </span> :
                                        <span title={gettext("Add filter")} className="more-grey"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                display._plugins["@nextgisweb/webmap/filter-layer/plugin"].run?.(nodeData.treeItem)
                                                    .then(item => {
                                                        setFilterKeys(prev => ({ ...prev, [item.layerId]: item.id, }));
                                                        topics.publish("button_hidden");
                                                    })
                                            }}>
                                            <FilterIcon />
                                        </span>
                                    }
                                </> :
                                <>
                                    {filtered && <span className="more"><FilterIcon /></span>}
                                </>
                            }
                        </>)}
                        {actions}
                    </Row>
                    {showLegend && (
                        <Legend
                            checkable={checkable}
                            zoomToNgwExtent={(ngwExtent: NgwExtent) => {
                                display.map.zoomToNgwExtent(
                                    ngwExtent,
                                    display.displayProjection
                                );
                            }}
                            nodeData={nodeData.treeItem}
                            store={store}
                        />
                    )}
                </>
            );
        };

        const shouldShowLine = showLine && hasGroups;

        return (
            <Tree
                className={
                    "ngw-webmap-layers-tree" + (!shouldShowLine ? " flat" : "")
                }
                virtual={false}
                motion={false}
                checkable={checkable}
                selectable={selectable}
                showIcon
                showLine={shouldShowLine}
                onExpand={onExpand}
                expandedKeys={store.expanded}
                autoExpandParent={false}
                onCheck={onCheck}
                checkedKeys={store.checked}
                onSelect={_onSelect}
                selectedKeys={selectedKeys}
                treeData={treeItems}
                titleRender={titleRender}
                allowDrop={allowDrop}
                draggable={draggable && { icon: false }}
                onDrop={onDrop}
                blockNode
            />
        );
    }
);