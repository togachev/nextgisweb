import React, { useMemo, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import { Radio, Space } from "@nextgisweb/gui/antd";
import { route } from "@nextgisweb/pyramid/api";
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import "./Container.less";

const SortableItem = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id, disabled: props.disable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: 290,
        height: 40,
        zIndex: isDragging ? "100" : "auto",
        opacity: isDragging ? 0.3 : 1,
        cursor: props.disable ? "pointer" : "move",
    };

    return (
        <div {...listeners} {...attributes} ref={setNodeRef} style={style} className="menu-item" title={props.name}>
            <div className="menu-item-content">
                {props.name}
            </div>
        </div>
    );
};

export const ContainerMenu = (props) => {
    const { store, config } = props;
    const [disable, setDisable] = useState(true);

    const itemIds = useMemo(() => store.groupMapsGrid.map((item) => item.id), [store.groupMapsGrid]);

    const [radioValue, setRadioValue] = useState(itemIds);

    const updatePosition = async (id, id_pos) => {
        await route("resource.wmgroup.update_position", id, id_pos).get();
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            store.setGroupMapsGrid((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const savePositionMap = () => {
        setDisable(!disable);
    };

    useEffect(() => {
        if (disable) {
            store.groupMapsGrid.map((item, index) => {
                updatePosition(item.id, index)
            })
        }
    }, [disable]);

    const onClickGroupMapsGrid = (id) => {
		store.setItemsMapsGroup(store.listMaps.filter(item => item.id === id));
	}

    return (
        <div className="dnd-container">
            {config.isAdministrator === true && (<ButtonSave staticPosition={disable} onClickSave={savePositionMap} />)}
            <div className="menu-group">
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <Radio.Group onChange={(e) => { setRadioValue(e.target.value) }} value={radioValue}>
                        <SortableContext
                            items={itemIds}
                            strategy={verticalListSortingStrategy}
                        >
                            {store.groupMapsGrid.map((item) => (
                                <Radio.Button key={item.id} value={item.id}>
                                    <SortableItem
                                        key={item.id}
                                        id={item.id}
                                        name={item.webmap_group_name}
                                        handle={true}
                                        disable={disable}
                                        onClick={() => onClickGroupMapsGrid(item.id)}
                                    />
                                </Radio.Button>
                            ))}
                        </SortableContext>
                    </Radio.Group>
                </DndContext>
            </div>
        </div>
    );
};
