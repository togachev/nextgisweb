import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";

import { Row, Col, Tree } from "@nextgisweb/gui/antd";

import FolderClosedIcon from "./icons/folder.svg";
import FolderOpenIcon from "./icons/folder_open.svg";
import EditIcon from "@material-icons/svg/edit/outline";

import { DropdownActions } from "./DropdownActions";
import { DropdownIcon } from "./DropdownIcon";

import PropTypes from "prop-types";
import "./LayersTree.less";

const forItemInTree = (data, key, callback) => {
    for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
            return callback(data[i], i, data);
        }
        if (data[i].children) {
            forItemInTree(data[i].children, key, callback);
        }
    }
};

const forEachInTree = (data, callback) => {
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.children) {
            forEachInTree(item.children, callback, i);
        } else {
            callback(item, i, data);
        }
    }
};

const handleWebMapItem = (webMapItem) => {
    if (webMapItem.type === "root" || webMapItem.type === "group") {
        webMapItem.icon = ({ expanded }) =>
            expanded ? <FolderOpenIcon /> : <FolderClosedIcon />;
    } else if (webMapItem.type === "layer") {
        webMapItem.isLeaf = true;
        webMapItem.icon = (item) => {
            if (item.editable && item.editable === true) {
                return <EditIcon />;
            }
        };
    }

    if (webMapItem.children) {
        webMapItem.children.forEach(handleWebMapItem);
    }
};

export const LayersTree = observer(
    ({ store, onSelect, setLayerZIndex, getWebmapPlugins, zoomToNgwExtent }) => {
        const [draggable] = useState(true);
        const [selectedKeys, setSelectedKeys] = useState([]);
        const [autoExpandParent, setAutoExpandParent] = useState(true);
        const [update, setUpdate] = useState(false);

        const [moreClickId, setMoreClickId] = useState(undefined);
        const [legendClickId, setIconLegendClickId] = useState(undefined);

        const prepareWebMapItems = (webMapItems) => {
            webMapItems.forEach(handleWebMapItem);
            return webMapItems;
        };

        const treeItems = useMemo(
            () => prepareWebMapItems(store.webmapItems),
            [store.webmapItems]
        );

        const onExpand = (expandedKeysValue) => {
            store.setExpanded(expandedKeysValue);
            setAutoExpandParent(false);
        };

        const onCheck = (checkedKeysValue) => {
            store.handleCheckChanged(checkedKeysValue);
        };

        const _onSelect = (selectedKeysValue) => {
            setSelectedKeys(selectedKeysValue);
            if (onSelect) onSelect(selectedKeysValue);
        };

        const titleRender = (nodeData) => {
            const { title } = nodeData;

            return (
                <Row wrap={false}>
                    <Col flex="none">
                        {
                            nodeData.type == 'layer'
                                ?
                                (<DropdownIcon
                                    nodeData={nodeData}
                                    setIconLegendClickId={setIconLegendClickId}
                                    legendClickId={legendClickId}
                                    zoomToNgwExtent={zoomToNgwExtent}
                                />)
                                :
                                null
                        }
                    </Col>
                    <Col flex="auto" className="tree-item-title">
                        {title}
                    </Col>
                    <Col flex="none" className="iconCustom">
                        <DropdownActions
                            nodeData={nodeData}
                            getWebmapPlugins={getWebmapPlugins}
                            setMoreClickId={setMoreClickId}
                            moreClickId={moreClickId}
                            update={update}
                            setUpdate={setUpdate}
                        />
                    </Col>
                </Row>
            );
        };

        const onDrop = (info) => {
            const dropKey = info.node.key;
            const dragKey = info.dragNode.key;
            const dropPos = info.node.pos.split("-");
            const dropPosition =
                info.dropPosition - Number(dropPos[dropPos.length - 1]);

            const data = [...store.webmapItems];

            // Find dragObject
            let dragObj;
            forItemInTree(data, dragKey, (item, index, arr) => {
                arr.splice(index, 1);
                dragObj = item;
            });
            if (!info.dropToGap) {
                // Drop on the content
                forItemInTree(data, dropKey, (item) => {
                    item.children = item.children || [];
                    item.children.unshift(dragObj);
                });
            } else if (
                (info.node.children || []).length > 0 &&
                // Has children
                info.node.expanded &&
                // Is expanded
                dropPosition === 1 // On the bottom gap
            ) {
                forItemInTree(data, dropKey, (item) => {
                    item.children = item.children || [];
                    item.children.unshift(dragObj);
                });
            } else {
                let ar = [];
                let i;
                forItemInTree(data, dropKey, (_item, index, arr) => {
                    ar = arr;
                    i = index;
                });
                if (dropPosition === -1) {
                    ar.splice(i, 0, dragObj);
                } else {
                    ar.splice(i + 1, 0, dragObj);
                }
            }
            store.setWebmapItems(data);

            let zIndex = 1;

            forEachInTree(data, () => {
                zIndex++;
            });
            forEachInTree(data, (_item) => {
                setLayerZIndex(_item.id, zIndex--);
            });
        };

        return (
            <>
                <Tree
                    className="ngw-webmap-layers-tree"
                    virtual={false}
                    motion={false}
                    checkable
                    showIcon
                    onExpand={onExpand}
                    expandedKeys={store.expanded}
                    autoExpandParent={autoExpandParent}
                    onCheck={onCheck}
                    checkedKeys={store.checked}
                    onSelect={_onSelect}
                    selectedKeys={selectedKeys}
                    treeData={treeItems}
                    titleRender={titleRender}
                    allowDrop={(e) => {
                        return e.dropNode.isLeaf ? e.dropPosition : true;
                    }}
                    draggable={draggable && { icon: false }}
                    onDrop={onDrop}
                    blockNode
                // onClick={(e) => {
                //     e.stopPropagation();
                // }}
                />
            </>
        );
    }
);

LayersTree.propTypes = {
    store: PropTypes.object,
    onSelect: PropTypes.func,
    getWebmapPlugins: PropTypes.func,
    setLayerZIndex: PropTypes.func,
    zoomToNgwExtent: PropTypes.func,
};
