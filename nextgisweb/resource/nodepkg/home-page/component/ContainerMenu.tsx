import { FC, useCallback, HTMLAttributes } from "react";
import { observer } from "mobx-react-lite";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import SwapVertical from "@nextgisweb/icon/mdi/swap-vertical";
import Delete from "@nextgisweb/icon/mdi/delete-outline";
import DisabledVisible from "@nextgisweb/icon/material/disabled_visible";
import { Button, Radio, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { DragItem } from "./DragItem";
import { AddMapGroup } from "./AddMapGroup";

import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const deleteGroup = gettext("Delete group");

export type ItemProps = HTMLAttributes<HTMLDivElement> & {
    id: number;
    isDragging?: boolean;
};

const SortableMenu: FC<ItemProps> = observer((props) => {
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
        width: store.widthMenu,
        height: 40,
        zIndex: isDragging ? "100" : "auto",
        cursor: store.editGroup ? "pointer" : "move",
        border: store.editGroup ? "none" : "1px solid var(--divider-color)",
        touchAction: store.editGroup ? "auto" : "none",
        color: enabled ? "var(--primary)" : "var(--danger)",
        opacity: isDragging ? "0" : "1",
    };

    const onClickGroupMenu = useCallback((id: number) => {
        store.setActiveGroupId(id);
        store.setItemsMapsGroup(store.allLoadedResources.get(id).mapgroup_group.groupmaps);
    }, []);

    return (
        <div className="menu-item" {...listeners} {...attributes} ref={setNodeRef}>
            <Radio.Button
                title={display_name}
                className="menu-content"
                disabled={store.editMap === false}
                style={style}
                key={id}
                value={id}
                checked={id === 0}
                onClick={() => onClickGroupMenu(id)}>
                <div className="menu-item-content">
                    {display_name}
                </div>
                <span className="icon-disable-menu" title={gettext("Disabled group")}>
                    {!store.edit && !enabled ? <DisabledVisible /> : store.edit && store.editGroup && store.update && (
                        <>
                            <AddMapGroup type="group" tab="maps" store={store} id={id} operation="update" icon="open" />
                            <Button
                                size="small"
                                title={deleteGroup}
                                className="button-update"
                                onClick={() => store.deleteGroup(id)}
                                icon={<Delete />}
                                target="_blank"
                                type="text"
                            />
                        </>
                    )}
                </span>
            </Radio.Button>
        </div>
    );
});

export const ContainerMenu = observer((props) => {
    const { store } = props;

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const handleDragStart = useCallback((e: DragStartEvent) => {
        store.setActiveGroupId(e.active.id);
    }, []);

    const handleDragEnd = useCallback((e: DragEndEvent) => {
        const { active, over } = e;
        if (active.id !== over?.id) {
            const resourceItems = store.resources
            const oldIndex = resourceItems.findIndex((item) => item.resource.id === active.id);
            const newIndex = resourceItems.findIndex((item) => item.resource.id === over.id);
            const value = arrayMove(resourceItems, oldIndex, newIndex);
            store.setResources(value);
        }
    }, []);

    const handleDragCancel = useCallback(() => {
        store.setActiveGroupId(null);
    }, []);

    const savePositionMap = useCallback(() => {
        store.setEditGroup(!store.editGroup);
        if (store.editGroup) {
            const value = store.resources.map((item, index) => ({ id: item.resource.id, position: index }))
            store.updatePosition({ params: value }, "mapgroup.groups");
            store.reload()
        }
    }, []);

    return (
        <div className="dnd-container-menu">
            <Space direction="horizontal" className="edit-group">
                {store.resources.length > 0 && store.edit && store.update &&
                    <AddMapGroup type="group" disabled={!store.editMap || !store.editGroup} store={store} operation="create" icon="add" />
                }
                {store.resources.length > 1 && store.edit && store.update ?
                    <ButtonSave icon={<SwapVertical />} text={gettext("Edit group maps")} staticPosition={store.editGroup} disabled={!store.editMap} onClickSave={savePositionMap} /> : <></>
                }
            </Space>
            <div
                className="menu-group"
                style={store.editGroup ? {} : { boxShadow: "inset 0 0 3px 0", borderRadius: 3 }}
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext
                        items={store.resources.map((item) => item.resource.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <Radio.Group value={store.activeGroupId}>
                            {store.resources.map((item, key) => {
                                if (item.mapgroup_resource.enabled === false && store.edit === false) return;

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
                    <DragOverlay adjustScale style={{ transformOrigin: "0 0 " }}>
                        {store.activeGroupId ?
                            <DragItem
                                id={store.activeGroupId}
                                store={store}
                                width={store.edit ? store.widthMenu - 29 : store.widthMenu}
                                height={40}
                                display_name={store.allLoadedResources.get(store.activeGroupId).resource.display_name}
                                isDragging
                            /> :
                            null
                        }
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
});
