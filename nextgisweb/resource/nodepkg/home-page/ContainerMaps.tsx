import { useMemo, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import { Empty } from "@nextgisweb/gui/antd";
import { route } from "@nextgisweb/pyramid/api";
import { MapTile } from "./MapTile";
import { routeURL } from "@nextgisweb/pyramid/api";
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from "@dnd-kit/sortable";

const SortableMaps = (props) => {
    const { item, disable, config, size, store } = props;

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
    };
    const preview = routeURL("resource.preview", item.id)
    return (
        <div className="maps-item" {...listeners} {...attributes} ref={setNodeRef}>
            <div
                title={item.display_name}
                style={style}
            >
                {disable ? (<MapTile config={config} item={item} store={store} />) :
                    (<div className="drag-item"><div className="content-drag">
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
                            (<div className="empty-block"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>)}
                    </div>)}
            </div>
        </div>
    );
};

export const ContainerMaps = (props) => {
    const { store, config, size } = props;
    const [disable, setDisable] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const itemIds = useMemo(() => store.itemsMapsGroup.map((item) => item.idx), [store.itemsMapsGroup]);

    const updatePosition = async (id, id_pos) => {
        await route("wmgroup.update", id, id_pos).get();
    };
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };
    const handleDragEnd = (event) => {
        setActiveId(null);
        const { active, over } = event;

        if (active.id !== over.id) {
            const items = store.itemsMapsGroup
            const oldIndex = items.findIndex((item) => item.idx === active.id);
            const newIndex = items.findIndex((item) => item.idx === over.id);
            const value = arrayMove(items, oldIndex, newIndex);
            store.setItemsMapsGroup(value);
        }
    };

    const savePositionMap = () => {
        setDisable(!disable);
    };

    useEffect(() => {
        if (disable === true && store.sourceMaps === true) {
            store.itemsMapsGroup.map((item, index) => {
                updatePosition(item.idx, index);
            })
            store.setSourceMaps(false);
        } else {
            store.setSourceMaps(true);
        }
    }, [disable]);

    return (
        <div className="dnd-container-maps">
            {config.isAdministrator === true &&
                (<ButtonSave staticPosition={disable} onClickSave={savePositionMap} />)
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
                                    config={config}
                                    size={size}
                                />
                            )
                        })}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};