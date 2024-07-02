import React, { useMemo, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import { route } from "@nextgisweb/pyramid/api";
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from "@dnd-kit/sortable";

import "./Container.less";

const SortableMaps = (props) => {
    const { id, name, disable } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id, disabled: disable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: 290,
        height: 40,
        zIndex: isDragging ? "100" : "auto",
        opacity: isDragging ? 0.3 : 1,
        cursor: disable ? "pointer" : "move",
    };

    return (
        <div {...listeners} {...attributes} ref={setNodeRef}>
            <div
                title={name}
                className="menu-item"
                style={style}
            >
                <div className="menu-item-content">{name}</div>
            </div>
        </div>
    );
};

export const ContainerMaps = (props) => {
    const { store, config } = props;
    const [disable, setDisable] = useState(true);

    const itemIds = useMemo(() => store.itemsMapsGroup.map((item) => item.idx), [store.itemsMapsGroup]);

    const updatePosition = async (id, id_pos) => {
        await route("wmgroup.update", id, id_pos).get();
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            store.setItemsMapsGroup((items) => {
                const oldIndex = items.findIndex((item) => item.idx === active.id);
                const newIndex = items.findIndex((item) => item.idx === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const savePositionMap = () => {
        setDisable(!disable);
    };

    useEffect(() => {
        if (disable) {
            store.itemsMapsGroup.map((item, index) => {
                updatePosition(item.idx, index);
            })
        }
    }, [disable]);



    return (
        <div className="dnd-container">
            {config.isAdministrator === true && (<ButtonSave staticPosition={disable} onClickSave={savePositionMap} />)}
            <div className="menu-group">
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={itemIds}
                        strategy={rectSortingStrategy}
                    >
                        {store.itemsMapsGroup.map((item) => {
                            return (
                                <SortableMaps
                                    key={item.idx}
                                    id={item.idx}
                                    name={item.display_name}
                                    handle={true}
                                    disable={disable}
                                    store={store}
                                />
                            )
                        })}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};