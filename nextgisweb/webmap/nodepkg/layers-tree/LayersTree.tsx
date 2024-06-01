import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";

import { Col, Row, Tree } from "@nextgisweb/gui/antd";
import type { TreeProps } from "@nextgisweb/gui/antd";
import FolderClosedIcon from "./icons/folder.svg";
import FolderOpenIcon from "./icons/folder_open.svg";

import type WebmapStore from "../store";
import type { TreeItem } from "../type/TreeItems";
import type { WebmapPlugin } from "../type/WebmapPlugin";
import type { DojoDisplay } from "../type";
import type { NgwExtent } from "@nextgisweb/feature-layer/type/FeatureExtent";

import { DropdownActions } from "./DropdownActions";
import { DropdownFile } from "./DropdownFile";
import { IconItem } from "./IconItem";
import { Legend } from "./Legend";
import { LegendAction } from "./LegendAction";
import { useDrag } from "./hook/useDrag";
import {
    keyInMutuallyExclusiveGroupDeep,
    prepareWebMapItems,
    updateKeysForGroup,
    updateKeysForMutualExclusivity,
} from "./util/treeItems";

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
    showLegend?: boolean;
    showDropdown?: boolean;
    display: DojoDisplay;
}

export const LayersTree = observer(
    ({
        store,
        onSelect,
        setLayerZIndex,
        getWebmapPlugins,
        onReady,
        showLegend = true,
        showDropdown = true,
        display,
    }: LayersTreeProps) => {
        const [draggable] = useState(true);
        const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
        const [autoExpandParent, setAutoExpandParent] = useState(true);
        const [moreClickId, setMoreClickId] = useState<number>();
        const [fileClickId, setFileClickId] = useState<number>();
        const [update, setUpdate] = useState(false);
        const webmapItems = store.webmapItems;

        const handleWebMapItem = (webMapItem: TreeItem): TreeWebmapItem => {
            const { key, title } = webMapItem;
            const item: TreeWebmapItem = { key, title, treeItem: webMapItem };
            if (item.treeItem.type === "root" || item.treeItem.type === "group") {
                item.icon = ({ expanded }) =>
                    expanded ? <FolderOpenIcon className="close-open-icon" /> :
                        <FolderClosedIcon className="close-open-icon" />;

            } else if (item.treeItem.type === "layer") {
                item.isLeaf = true;

                if ("legendInfo" in item.treeItem) {
                    const { legendInfo } = item.treeItem;
                    if (legendInfo && legendInfo.visible && legendInfo.single) {
                        item.legendIcon = (
                            <div className="colSingleIconLegend">
                                <IconItem
                                    single={legendInfo.single}
                                    item={item.treeItem}
                                    zoomToNgwExtent={(ngwExtent: NgwExtent) => {
                                        display.map.zoomToNgwExtent(
                                            ngwExtent,
                                            display.displayProjection
                                        );
                                    }}
                                />
                            </div>

                        );
                    }
                }

                item.icon = (item_) => {
                    const item = item_ as TreeWebmapItem;
                    if ((item.treeItem as LayerItem).editable === true) {
                        return <EditIcon />;
                    } else {
                        if (item.legendIcon) {
                            return item.legendIcon;
                        }
                    }
                };
            }

            if ("children" in webMapItem) {
                item.children = webMapItem.children.map(handleWebMapItem);
            }
            return item;
        };

        const prepareWebMapItems = (webMapItems: TreeItem[]) => {
            return webMapItems.map(handleWebMapItem);
        };

        const { onDrop, allowDrop } = useDrag({ store, setLayerZIndex });

        const treeItems = useMemo(
            () => prepareWebMapItems(webmapItems),
            [webmapItems]
        );

        const hasGroups = useMemo(() => {
            for (const itm of webmapItems) {
                if (itm.type === "group") {
                    return true;
                }
            }
            return false;
        }, [webmapItems]);

        useEffect(() => {
            if (onReady) {
                onReady();
            }
        }, [onReady]);

        const onExpand = (expandedKeysValue: React.Key[]) => {
            store.setExpanded(expandedKeysValue.map(Number));
            setAutoExpandParent(false);
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

        const titleRender = (nodeData: TreeWebmapItem) => {
            const { title } = nodeData.treeItem;
            const shouldActions = showLegend || showDropdown;

            let actions;
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
                const dropdownFile = showDropdown && (
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
                        {dropdownFile}
                        {dropdownAction}
                    </Col>
                );
            }
            const legendAction = showLegend && (
                <LegendAction
                    nodeData={nodeData.treeItem}
                    onClick={() => setUpdate(!update)}
                />
            );
            return (
                <>
                    <Row wrap={false}>
                        <Col flex="auto" className="tree-item-title">
                        {legendAction}
                            <div className="legend-title">{title}</div>
                        </Col>
                        {actions}
                    </Row>
                    {showLegend && (<Legend
                        zoomToNgwExtent={(ngwExtent: NgwExtent) => {
                            display.map.zoomToNgwExtent(
                                ngwExtent,
                                display.displayProjection
                            );
                        }}
                        nodeData={nodeData.treeItem} store={store} />)}
                </>
            );
        };

        return (
            <Tree
                className={
                    "ngw-webmap-layers-tree" + (!hasGroups ? " flat" : "")
                }
                virtual={false}
                motion={false}
                checkable
                showIcon
                showLine={hasGroups}
                onExpand={onExpand}
                expandedKeys={store.expanded}
                autoExpandParent={autoExpandParent}
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