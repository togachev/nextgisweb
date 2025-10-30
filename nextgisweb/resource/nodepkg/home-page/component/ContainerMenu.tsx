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
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const settingsGroup = gettext("Group settings");

const SortableMenu = observer((props) => {
    const { id, name, store, disable, update, enabled } = props;
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
        width: store.edit ? store.widthMenu - 29 : store.widthMenu,
        height: 40,
        zIndex: isDragging ? "100" : "auto",
        opacity: isDragging ? 0.3 : 1,
        cursor: disable ? "pointer" : "move",
        border: disable ? "none" : "1px solid var(--divider-color)",
        touchAction: disable ? "auto" : "none",
        color: enabled ? "var(--primary)" : "var(--danger)",
    };

    const onClickGroupMapsGrid = (id) => {
        store.setItemsMapsGroup(store.listMaps.filter(item => item.webmap_group_id === id).sort((a, b) => a.position - b.position));
    };

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
                <div className="menu-item-content">
                    {name}
                </div>
                <span className="icon-disable" title={gettext("Disabled group")}>
                    {!store.edit && !enabled ? <DisabledVisible /> : store.edit && update && (
                        <Button
                            title={settingsGroup}
                            className="button-update"
                            href={routeURL("resource.update", id)}
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
    const [disable, setDisable] = useState(true);
    const itemIds = useMemo(() => store.groupMapsGrid.map((item) => item.id), [store.groupMapsGrid]);

    const [radioValue, setRadioValue] = useState(itemIds[0]);

    const updatePosition = async (id, position) => {
        const payload = {
            id: id,
            position: position
        };
        return await route("mapgroup.groups").post({
            json: payload,
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const items = store.groupMapsGrid
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const value = arrayMove(items, oldIndex, newIndex);
            store.setGroupMapsGrid(value);
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
            setRadioValue(itemIds[0]);
            store.getMapValues("all");
        }
        else {
            store.setSourceGroup(true);
        }
    }, [disable]);

    return (
        <div className="dnd-container-menu">
            {store.edit && store.groupMapsGrid.some((item) => item.update) &&
                (<ButtonSave icon={<SwapVertical />} className="edit-group-maps" text={gettext("Edit group maps")} staticPosition={disable} onClickSave={savePositionMap} />)
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
                                    update={item.update}
                                    enabled={item.enabled}
                                />
                            ))}
                        </Radio.Group>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
});
