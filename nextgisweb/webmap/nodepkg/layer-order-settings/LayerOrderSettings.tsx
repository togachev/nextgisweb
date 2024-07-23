import { useMemo, useEffect, useState } from "react";
import { Button, Checkbox, Modal } from "@nextgisweb/gui/antd";
import type { CheckboxProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { observer } from "mobx-react-lite";


import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ButtonSave } from "@nextgisweb/resource/home-page";
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
    const { id, name, store } = props;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: 290,
        height: 40,
        zIndex: isDragging ? "100" : "auto",
        opacity: isDragging ? 0.3 : 1,
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
                onClick={() => onClickGroupMapsGrid(id)}
            >
                <div className="menu-item-content">{name}</div>
            </Radio.Button>
        </div>
    );
};

const title = gettext("Setting the order of drawing layers on a web map");
const edit = gettext("Edit");
const enableIdentifyOrder = gettext("Link layer identification on web map to layer order");
const enableDrawOrder = gettext("Enable/disable layer orders");

// let result = [];
// const getItems = (obj) => {
//     for (let key in obj) {
//         if (typeof obj[key] === 'object' && obj[key] !== null && obj[key].length !== 0 ) {
//             getItems(obj[key]);
//         } else {
//             if (obj[key] === 'layer') {
//                 result.push(obj);
//             }
//         }
//     }
// }
// getItems(store.root_item)
// console.log(result);

export const LayerOrderSettings = observer(({ store }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    console.log(store.layer_order);




    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const identifyOrderChange: CheckboxProps['onChange'] = (e) => {
        store.update({ identify_order_enabled: e.target.checked });
    };

    const drawOrderOrderChange: CheckboxProps['onChange'] = (e) => {
        store.update({ draw_order_enabled: e.target.checked });
    };


    const [disable, setDisable] = useState(true);
    const [groupMapsGrid, setGroupMapsGrid] = useState(store.layer_order.reverse());

    const itemIds = groupMapsGrid && useMemo(() => groupMapsGrid.map((item) => item.layer_style_id), [groupMapsGrid]);

    console.log(itemIds);

    const [radioValue, setRadioValue] = useState(itemIds[0]);


    const updatePosition = async (parent_id, layer_style_id, draw_order_position) => {
        await route("webmap.item.update", parent_id, layer_style_id, draw_order_position).get();
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setGroupMapsGrid((items) => {
                const oldIndex = items.findIndex((item) => item.layer_style_id === active.id);
                const newIndex = items.findIndex((item) => item.layer_style_id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const savePositionMap = () => {
        groupMapsGrid.map((item, index) => {
            console.log(item, index);
            
            updatePosition(item.parent_id, item.layer_style_id, index)
        })
    };


    // useEffect(() => {
    //     if (disable === false) {
    //         groupMapsGrid.map((item, index) => {
    //             console.log(item, index);
                
    //             updatePosition(item.parent_id, item.layer_style_id, index)
    //         })
    //         setDisable(true);
    //     }
    // }, [disable]);
    return (
        <>
            <Button
                size="small"
                style={{ maxWidth: "15em" }}
                title={edit}
                onClick={showModal}
            >
                {edit}
            </Button>
            <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <Checkbox checked={store.identify_order_enabled} onChange={identifyOrderChange}>
                    {enableIdentifyOrder}
                </Checkbox>
                <Checkbox checked={store.draw_order_enabled} onChange={drawOrderOrderChange}>
                    {enableDrawOrder}
                </Checkbox>

                <div className="dnd-container-menu">
                    <Button onClick={savePositionMap} />
                    <div
                        className="menu-group"
                    >
                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={itemIds}
                                strategy={verticalListSortingStrategy}
                            >
                                {groupMapsGrid.map((item) => (
                                    <SortableMenu
                                        key={item.layer_style_id}
                                        id={item.layer_style_id}
                                        name={item.display_name}
                                        handle={true}
                                        // disable={disable}
                                        store={store}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            </Modal>
        </>

    );
});