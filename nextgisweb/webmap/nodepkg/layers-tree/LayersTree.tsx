import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Col, Row, Tree } from "@nextgisweb/gui/antd";
import type { TreeProps } from "@nextgisweb/gui/antd";

import type { PluginBase } from "../plugin/PluginBase";
import type WebmapStore from "../store";
import type { TreeItemConfig } from "../type/TreeItems";

import type { TreeItem } from "../type/TreeItems";
import type { WebmapPlugin } from "../type/WebmapPlugin";
import type { Display } from "../display";
import type { NgwExtent } from "@nextgisweb/feature-layer/type/FeatureExtent";

import { DropdownActions } from "./DropdownActions";
import { DropdownFile } from "./DropdownFile";
import { Legend } from "./Legend";
import { LegendAction } from "./LegendAction";
import { useDrag } from "./hook/useDrag";
import { useWebmapItems } from "./hook/useWebmapItems";
import {
    // prepareWebMapItems,
    prepareWebMapItemsCustom,
    keyInMutuallyExclusiveGroupDeep,
    updateKeysForGroup,
    updateKeysForMutualExclusivity,
} from "./util/treeItems";

import "./LayersTree.less";

type TreeNodeData = NonNullable<TreeProps["treeData"]>[0];

export type TreeWebmapItem = TreeNodeData & {
    key: number;
    children?: TreeWebmapItem[];
    legendIcon?: React.ReactNode;
    treeItem: TreeItemConfig;
};

interface LayersTreeProps {
    store: WebmapStore;
    onSelect?: (keys: number[]) => void;
    setLayerZIndex: (id: number, zIndex: number) => void;
    getWebmapPlugins: () => Record<string, PluginBase>;
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
    display: Display;
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
        const webMapItems = store.webmapItems;

        const { onDrop, allowDrop } = useDrag({ store, setLayerZIndex });

        const { preparedWebMapItems } = useWebmapItems({ webMapItems });

        const treeItems = useMemo(() => {
            // let _webmapItems = prepareWebMapItems(webmapItems);
            // let _webmapItems = prepareWebMapItemsCustom(webMapItems);
            if (onFilterItems) {
                return onFilterItems(store, preparedWebMapItems);
            }
            return preparedWebMapItems;
        }, [onFilterItems, preparedWebMapItems, store]);

        const hasGroups = useMemo(
            () => webMapItems.some((item) => item.type === "group"),
            [webMapItems]
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

        const titleRender = useCallback(
            (nodeData: TreeWebmapItem) => {
                const { title, fileResourceVisible } = nodeData.treeItem;

                const shouldActions = showLegend || showDropdown;

                let actions;
                if (shouldActions) {
                    const legendAction = showLegend && (
                        <LegendAction
                            nodeData={nodeData.treeItem}
                            onClick={() => setUpdate(!update)}
                        />
                    );

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
                        {legendAction}
                        {dropdownFile}
                        {dropdownAction}
                    </Col>
                    );
                }

                    return (
                    <>
                        <Row wrap={false}>
                            <Col flex="auto" className="tree-item-title">
                                {title}
                            </Col>
                            {actions}
                        </Row>
                        {showLegend && (
                            <Legend
                                checkable={checkable}
                                nodeData={nodeData.treeItem}
                                store={store}
                            />
                        )}
                    </>
                    );
            },
                    [
                    checkable,
                    getWebmapPlugins,
                    moreClickId,
                    showDropdown,
                    showLegend,
                    store,
                    update,
                    ]
                    );

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

LayersTree.displayName = "LayersTree";
