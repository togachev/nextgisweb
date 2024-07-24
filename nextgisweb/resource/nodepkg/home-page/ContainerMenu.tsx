import { useMemo, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "./ButtonSave";
import { Radio } from "@nextgisweb/gui/antd";
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

const SortableMenu = (props) => {
    const { id, name, store, disable } = props;
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
        border: disable ? "none" : "1px solid var(--divider-color)",
    };

    const onClickGroupMapsGrid = (id) => {
        store.setItemsMapsGroup(store.listMaps.filter(item => item.webmap_group_id === id).sort((a, b) => a.id_pos - b.id_pos));
    }

    return (
        <div className="menu-item" {...listeners} {...attributes} ref={setNodeRef}>
            <Radio.Button
                title={name}
                className="menu-content"
                style={style}
                key={id}
                value={id}
                checked={id === 0}
                onClick={() => onClickGroupMapsGrid(id)}>
                <div className="menu-item-content">{name}</div>
            </Radio.Button>
        </div>
    );
};

export const ContainerMenu = (props) => {
    const { store, config } = props;
    const [disable, setDisable] = useState(true);

    const itemIds = useMemo(() => store.groupMapsGrid.map((item) => item.id), [store.groupMapsGrid]);
    console.log(itemIds);
    
    const [radioValue, setRadioValue] = useState(itemIds[0]);

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
        if (disable === true && store.sourceGroup === true) {
            store.groupMapsGrid.map((item, index) => {
                updatePosition(item.id, index)
            })
            store.setSourceGroup(false);
            setRadioValue(itemIds[0])
        } else {
            store.setSourceGroup(true);
        }
    }, [disable]);

    return (
        <div className="dnd-container-menu">
            {config.isAdministrator === true &&
                (<ButtonSave staticPosition={disable} onClickSave={savePositionMap} />)
            }
            <div
                className="menu-group"
                style={disable ? {} : { boxShadow: "inset 0 0 3px 0", borderRadius: 3 }}
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
                            onChange={(e) => { setRadioValue(e.target.value) }}
                            value={radioValue}
                        >
                            {store.groupMapsGrid.map((item) => (
                                <SortableMenu
                                    key={item.id}
                                    id={item.id}
                                    name={item.webmap_group_name}
                                    handle={true}
                                    disable={disable}
                                    store={store}
                                />
                            ))}
                        </Radio.Group>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};
