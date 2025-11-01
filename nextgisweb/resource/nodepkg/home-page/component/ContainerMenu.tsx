import { useMemo, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import SwapVertical from "@nextgisweb/icon/mdi/swap-vertical";
import OpenInNew from "@nextgisweb/icon/mdi/open-in-new";
import DisabledVisible from "@nextgisweb/icon/material/disabled_visible";
import { Button, Radio } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { getEntries } from "@nextgisweb/webmap/popup/util/function";
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback } from "react";

const settingsGroup = gettext("Group settings");

const SortableMenu = observer((props) => {
    const { store, item } = props;
    const { id, display_name } = item.resource;
    const { enabled } = item.mapgroup_resource;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id, disabled: store.editGroup });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: store.edit ? store.widthMenu - 29 : store.widthMenu,
        height: 40,
        zIndex: isDragging ? "100" : "auto",
        opacity: isDragging ? 0.3 : 1,
        cursor: store.editGroup ? "pointer" : "move",
        border: store.editGroup ? "none" : "1px solid var(--divider-color)",
        touchAction: store.editGroup ? "auto" : "none",
        color: enabled ? "var(--primary)" : "var(--danger)",
    };

    const onClickGroupMapsGrid = (id) => {
        if (!store.edit) {
            store.setItemsMapsGroup(store.listMaps.filter(item => item.webmap_group_id === id && item.enabled).sort((a, b) => a.position - b.position))
        } else {
            store.setItemsMapsGroup(store.listMaps.filter(item => item.webmap_group_id === id).sort((a, b) => a.position - b.position))
        }
    };

    return (
        <div className="menu-item" {...listeners} {...attributes} ref={setNodeRef}>
            <Radio.Button
                title={display_name}
                className="menu-content"
                style={style}
                key={id}
                value={id}
                checked={id === 0}
                onClick={() => onClickGroupMapsGrid(id)}>
                <div className="menu-item-content">
                    {display_name}
                </div>
                <span className="icon-disable-menu" title={gettext("Disabled group")}>
                    {!store.edit && !enabled ? <DisabledVisible /> : store.edit && (
                        <Button
                            title={settingsGroup}
                            className="button-update"
                            href={routeURL("resource.update_mapgroup", id, "group")}
                            icon={<OpenInNew />}
                            target="_blank"
                            type="text"
                            color={!enabled ? "danger" : "default"}
                            variant="link"
                        />
                    )}
                </span>
            </Radio.Button>
        </div>
    );
});

export const ContainerMenu = observer((props) => {
    const { store } = props;

    const itemIds = useMemo(() => store.resources.map((item) => item.resource.id), [store.resources]);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const items = store.groupMapsGrid
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const value = arrayMove(items, oldIndex, newIndex);
            store.setGroupMapsGrid(value);
        }
    }, []);

    const savePositionMap = useCallback(() => {
        store.setEditGroup(!store.editGroup);
        if (store.editGroup) {
            const value = store.groupMapsGrid.map((item, index) => ({ id: item.id, position: index }))
            store.updatePosition({ params: value }, "mapgroup.groups");
            store.setRadioValue(itemIds[0]);
        }
    }, []);

    // useEffect(() => {
    //     if (store.editGroup === true /*&& store.sourceGroup === true*/) {
    //         store.updatePosition(
    //             store.groupMapsGrid.map((item, index) => ({ id: item.id, position: index })),
    //             "mapgroup.groups"
    //         )

    //         // store.setSourceGroup(false);
    //         store.setRadioValue(itemIds[0]);
    //         // store.getMapValues("all");
    //     }
    //     // else {
    //     //     store.setSourceGroup(true);
    //     //     // store.getMapValues("all");
    //     // }
    // }, [store.editGroup, store.edit]);
    console.log(store.itemGroup);
    
    return (
        <div className="dnd-container-menu">
            {/* {store.edit && store.groupMapsGrid.some((item) => item.update) &&
                (<ButtonSave icon={<SwapVertical />} className="edit-group-maps" text={gettext("Edit group maps")} staticPosition={store.editGroup} onClickSave={savePositionMap} />)
            } */}
            <div
                className="menu-group"
                style={store.editGroup ? {} : { boxShadow: "inset 0 0 3px 0", borderRadius: 3 }}
            >
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={itemIds}
                        strategy={verticalListSortingStrategy}
                    >
                        <Radio.Group
                            onChange={(e) => { store.setRadioValue(e.target.value) }}
                            value={store.radioValue}
                        >
                            {store.resources.map((item,key) => {
                                return (
                                    <SortableMenu
                                        key={key}
                                        handle={true}
                                        store={store}
                                        item={item}
                                    />
                                )
                            })}
                        </Radio.Group>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
});
