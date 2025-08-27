import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon } from "@nextgisweb/gui/icon";
import { Col, Row, Tree } from "@nextgisweb/gui/antd";
import type { TreeProps } from "@nextgisweb/gui/antd";
import { findNode } from "@nextgisweb/gui/util/tree";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import type { PluginBase } from "../plugin/PluginBase";
import type WebmapStore from "../store";
import type { TreeItemConfig } from "../type/TreeItems";

import type { Display } from "@nextgisweb/webmap/display";

import { DropdownActions } from "./DropdownActions";
import { DropdownFile } from "./DropdownFile";
import { Legend } from "./Legend";
import { LegendAction } from "./LegendAction";
import { useDrag } from "./hook/useDrag";
import { useWebmapItems } from "./hook/useWebmapItems";
import {
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

const iconResources = ["wmsclient_layer", "tmsclient_layer", "tileset"]

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
    }: LayersTreeProps) => {
        const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
        const [moreClickId, setMoreClickId] = useState<number>();
        const [update, setUpdate] = useState(false);
        const { webmapItems, checked, layersWithoutLegendInfo } = store;

        const { onDrop, allowDrop } = useDrag({ store, setLayerZIndex });

        const { preparedWebMapItems } = useWebmapItems({ webmapItems });

        const treeItems = useMemo(() => {
            if (onFilterItems) {
                return onFilterItems(store, preparedWebMapItems);
            }
            return preparedWebMapItems;
        }, [onFilterItems, preparedWebMapItems, store]);

        const hasGroups = useMemo(
            () => webmapItems.some((item) => item.type === "group"),
            [webmapItems]
        );

        useEffect(() => {
            if (onReady) {
                onReady();
            }
        }, [onReady]);

        useEffect(() => {
            store.updateResourceLegendSymbols(
                layersWithoutLegendInfo.map((layer) => layer.styleId)
            );
        }, [store, layersWithoutLegendInfo]);

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

        const _onSelect = useCallback(
            (selectedKeysValue: React.Key[]) => {
                const val = selectedKeysValue.map(Number);
                setSelectedKeys(val);
                if (onSelect) onSelect(val);
            },
            [onSelect]
        );

        const titleRender = useCallback(
            (nodeData: TreeWebmapItem) => {
                const { title, fileResourceVisible } = nodeData.treeItem;
                const shouldActions = showLegend || showDropdown;

                let actions;
                let legendAction;
                if (shouldActions) {

                    if (nodeData.treeItem.type === "layer") {
                        const treeLayer = nodeData.treeItem;

                        legendAction = treeLayer.legendInfo.symbols &&
                            treeLayer.legendInfo.symbols.length > 1 &&
                            showLegend && (
                                <LegendAction
                                    nodeData={treeLayer}
                                    onClick={() => setUpdate(!update)}
                                />
                            );
                    }

                    const dropdownAction = showDropdown && (
                        <DropdownActions
                            nodeData={nodeData.treeItem}
                            getWebmapPlugins={getWebmapPlugins}
                            setMoreClickId={(id) => {
                                if (id !== undefined) {
                                    _onSelect([id]);
                                }
                                setMoreClickId(id);
                            }}
                            moreClickId={moreClickId}
                            update={update}
                            setUpdate={setUpdate}
                        />
                    );
                    const dropdownFile = showDropdown && fileResourceVisible === true && (
                        <DropdownFile
                            nodeData={nodeData.treeItem}
                        />
                    );
                    actions = (
                        <Col
                            className="tree-item-action"
                            style={{ alignItems: "center" }}
                        >
                            {dropdownFile}
                            {dropdownAction}
                        </Col>
                    );
                }

                return (
                    <>
                        <Row wrap={false}>
                            <Col flex="auto" className="tree-item-title">
                                {legendAction}
                                <TitleComponent title={title} item={nodeData.treeItem} />
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
                _onSelect,
                checkable,
                getWebmapPlugins,
                moreClickId,
                showDropdown,
                showLegend,
                store,
                update,
            ]
        );

        const TitleComponent = ({ title, item }) => {
            const edit = item.type === "layer" && item.editable === true ? true : false;
            return (
                <Row className="item-title">
                    <Col className={edit ? "legend-title edit-title" : "legend-title"}>
                        {iconResources.includes(item.cls) && <span className="icon-resources">
                            <SvgIcon icon={`rescls-${item.cls}`} />
                        </span>}
                        {title}
                    </Col>
                    {edit && (<Col className="edit-icon"><EditIcon /></Col>)}
                </Row>
            )
        }

        const checkedKeys = useMemo(() => {
            const ch = checked.filter((id) =>
                findNode(treeItems, (node) => node.key === id)
            );
            return ch;
        }, [checked, treeItems]);

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
                checkedKeys={checkedKeys}
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