import { useCallback, useMemo, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import SwapVertical from "@nextgisweb/icon/mdi/arrow-all";
import { Empty } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { MapTile } from "./MapTile";
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from "@dnd-kit/sortable";

const SortableMaps = observer((props) => {
    const { item, disable, size, store } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.idx, disabled: disable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: disable ? size.maxW : size.minW,
        height: disable ? size.maxH : size.minH,
        zIndex: isDragging ? "100" : "auto",
        cursor: disable ? "pointer" : "move",
        touchAction: disable ? "auto" : "none",
        boxSizing: "border-box",
        border: "1px solid rgb(179 185 190 / 65%)",
        borderRadius: "4px",
    };
    const preview = routeURL("maptile.preview", item.id);

    return (
        <div className="maps-item" {...listeners} {...attributes} ref={setNodeRef}>
            <div
                title={item.display_name}
                style={style}
            >
                {disable ? (<MapTile item={item} store={store} size={size} />) :
                    (
                        <div className="drag-item">
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
                                (<div className="empty-block"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>)
                            }
                        </div>
                    )}
            </div>
        </div>
    );
});

export const ContainerMaps = observer((props) => {
    const { store, size } = props;
    const [disable, setDisable] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const itemIds = useMemo(() => store.itemsMapsGroup.map((item) => item.idx), [store.itemsMapsGroup]);

    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
    }, []);

    const handleDragEnd = useCallback((event) => {
        setActiveId(null);
        const { active, over } = event;

        if (active.id !== over.id) {
            const items = store.itemsMapsGroup
            const oldIndex = items.findIndex((item) => item.idx === active.id);
            const newIndex = items.findIndex((item) => item.idx === over.id);
            const value = arrayMove(items, oldIndex, newIndex);
            store.setItemsMapsGroup(value);
        }
    }, []);

    const savePositionMap = useCallback(() => {
        setDisable(!disable);
        store.updatePosition(
            store.itemsMapsGroup.map((item, index) => ({ id: item.idx, position: index })),
            "mapgroup.maps"
        )
    }, [disable]);

    // useEffect(() => {
    //     if (disable === true) {
    //         store.updatePosition(
    //             store.itemsMapsGroup.map((item, index) => ({ id: item.idx, position: index })),
    //             "mapgroup.maps"
    //         )
    //     }
    // }, [disable, store.edit]);

    return (
        <div className="dnd-container-maps">
            {store.edit && store.itemsMapsGroup.some((item) => item.update) &&
                (<ButtonSave icon={<SwapVertical />} className="edit-grid-maps" text={gettext("Edit grid maps")} staticPosition={disable} onClickSave={savePositionMap} />)
            }
            <div
                className="maps-group"
                style={disable ?
                    { gridTemplateColumns: `repeat(auto-fill, minmax(${size.maxW}px, 1fr))` } :
                    {
                        gridTemplateColumns: `repeat(auto-fill, minmax(${size.minW}px, 1fr))`, boxShadow: "inset 0 0 3px 0",
                        borderRadius: 3, padding: 5
                    }
                }>
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                    style={disable ?
                        {
                            width: size.minW,
                            height: size.minH
                        } : {
                            width: size.maxW,
                            height: size.maxH
                        }
                    }
                >
                    <SortableContext
                        items={itemIds}
                        strategy={rectSortingStrategy}
                    >
                        {store.itemsMapsGroup.map((item) => {
                            return (
                                <SortableMaps
                                    key={item.idx}
                                    item={item}
                                    handle={true}
                                    disable={disable}
                                    store={store}
                                    activeId={activeId}
                                    size={size}
                                />
                            )
                        })}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
});