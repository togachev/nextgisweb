import { useCallback, FC, HTMLAttributes } from "react";
import { observer } from "mobx-react-lite";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import SwapVertical from "@nextgisweb/icon/mdi/arrow-all";
import { Empty, Space } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { MapTile } from "./MapTile";
import { DragItem } from "./DragItem";

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
    rectSortingStrategy,
} from "@dnd-kit/sortable";

export type ItemProps = HTMLAttributes<HTMLDivElement> & {
    id: string;
    isDragging?: boolean;
};

const SortableMaps: FC<ItemProps> = observer((props) => {
    const { item, size, store } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({ id: item.id, disabled: store.editMap });

    const style = {
        transform: CSS.Transform.toString(transform),
        width: store.editMap ? size.maxW : size.minW,
        height: store.editMap ? size.maxH : size.minH,
        zIndex: isDragging ? "100" : "auto",
        cursor: store.editMap ? "pointer" : "move",
        touchAction: store.editMap ? "auto" : "none",
        boxSizing: "border-box",
        border: "1px solid rgb(179 185 190 / 65%)",
        borderRadius: 3,
        opacity: isDragging ? "0" : "1",
    };

    const preview = routeURL("maptile.preview", { id: item.webmap_id });

    return (
        <div className="maps-item" {...listeners} {...attributes} ref={setNodeRef}>
            <div
                title={item.display_name}
                style={style}
            >
                {store.editMap ? (<MapTile item={item} store={store} size={size} />) :
                    (<div className="drag-item">
                        <div className={!item.enabled ? "content-drag disabled-title" : "content-drag"}>
                            {item?.display_name}
                        </div>
                        {item.preview_fileobj_id ?
                            (<div
                                style={{
                                    bottom: 0,
                                    borderRadius: 3,
                                    height: 95,
                                    background: `url(${preview}) center center / cover no-repeat`,
                                }}
                            ></div>) :
                            (<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />)
                        }
                    </div>)}
            </div>
        </div>
    );
});

export const ContainerMaps = observer((props) => {
    const { store, size } = props;

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const handleDragStart = useCallback((e: DragStartEvent) => {
        store.setActiveMapId(e.active.id);
    }, []);

    const handleDragEnd = useCallback((e: DragEndEvent) => {
        const { active, over } = e;
        if (active.id !== over.id) {
            const items = store.itemsMapsGroup
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const value = arrayMove(items, oldIndex, newIndex);
            store.setItemsMapsGroup(value);
        }

        store.setActiveMapId(null);
    }, []);

    const handleDragCancel = useCallback(() => {
        store.setActiveMapId(null);
    }, []);


    const savePositionMap = useCallback(() => {
        store.setEditMap(!store.editMap);
        if (store.editMap) {
            const mapgroup_group = store.allLoadedResources.get(store.activeGroupId).mapgroup_group;
            mapgroup_group.groupmaps = store.itemsMapsGroup;
            const value = store.itemsMapsGroup.map((item, index) => ({ id: item.id, position: index }))
            store.updatePosition({ params: value }, "mapgroup.maps");
        }
    }, []);

    return (
        <div className="dnd-container-maps" key={store.activeGroupId}>
            <Space direction="horizontal" className="edit-maps">
                {store.itemsMapsGroup.length > 1 && store.edit && store.update ?
                    (<ButtonSave disabled={!store.editGroup} icon={<SwapVertical />} text={gettext("Edit grid maps")} staticPosition={store.editMap} onClickSave={savePositionMap} />) : store.edit && store.update && (<div style={{ height: 24 }}></div>)
                }
            </Space>
            <div
                className="maps-group"
                style={store.editMap ?
                    { gridTemplateColumns: `repeat(auto-fill, minmax(${size.maxW}px, 1fr))` } :
                    {
                        gridTemplateColumns: `repeat(auto-fill, minmax(${size.minW}px, 1fr))`, boxShadow: "inset 0 0 3px 0",
                        borderRadius: 3, padding: 5
                    }
                }>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                    style={store.editMap ?
                        { width: size.minW, height: size.minH } :
                        { width: size.maxW, height: size.maxH }
                    }
                >
                    <SortableContext
                        items={store.itemsMapsGroup.map((item) => item.id)}
                        strategy={rectSortingStrategy}
                    >
                        {store.itemsMapsGroup.map((item, key) => {
                            if (item.enabled === false && store.edit === false) return;
                            return (
                                <SortableMaps
                                    key={key}
                                    item={item}
                                    handle={true}
                                    store={store}
                                    size={size}
                                />
                            )
                        })}
                    </SortableContext>
                    <DragOverlay adjustScale style={{ transformOrigin: "0 0 " }}>
                        {store.activeMapId ?
                            <DragItem
                                id={store.activeMapId}
                                size={size}
                                store={store}
                                width={store.editMap ? size.maxW : size.minW}
                                height={store.editMap ? size.maxH : size.minH}
                                display_name={store.allMapsGroup.get(store.activeMapId).display_name}
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