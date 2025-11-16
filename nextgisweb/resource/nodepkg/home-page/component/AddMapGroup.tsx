import { useCallback } from "react";
import { Button, Modal } from "@nextgisweb/gui/antd";
import showModal from "@nextgisweb/gui/showModal";
import AddCircle from "@nextgisweb/icon/material/add_circle";
import Pencil from "@nextgisweb/icon/mdi/pencil-outline";

import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";

import "@nextgisweb/resource/composite/CompositeWidget.less";
import { observer } from "mobx-react-lite";
import { HomeStore } from "../HomeStore";
import { msg } from "./msg";
import { MapgroupModal } from "./MapgroupModal";

interface StoreProps {
    store: HomeStore;
    icon?: string;
    operation: string;
    id?: number;
    type: string;
    tab?: string;
    text?: string;
    disabled?: boolean;
}

export type CompositeSetup =
    | { operation: "create"; cls: string; parent: number }
    | { operation: "update"; id: number };

interface CompositeWidgetProps {
    store?: HomeStore;
    setup?: CompositeSetup;
    tab?: string;
    type?: string;
}

export type ModalProps = Parameters<typeof Modal>[0];

export interface MapgroupModalProps extends ModalProps {
    mapgroupOptions?: CompositeWidgetProps;
}

export const AddMapGroup = observer((props: StoreProps) => {
    const { showResourcePicker } = useResourcePicker({ initParentId: 0 });
    const { id, icon, store, type, operation, tab, text, disabled } = props;

    const onGroups = useCallback(() => {
        if (operation === "create") {
            showResourcePicker({
                pickerOptions: {
                    requireClass: "resource_group",
                    initParentId: 0,
                    clsFilter: "add_mapgroup_group",
                },
                onSelect: (resourceId: number) => {
                    const setup = { operation: operation, cls: "mapgroup_resource", parent: resourceId }
                    return showModal(MapgroupModal, {
                        transitionName: "",
                        maskTransitionName: "",
                        mapgroupOptions: {
                            store: store,
                            setup: setup,
                            tab: tab,
                        },
                    });
                },
            })
        } else {
            showModal(MapgroupModal, {
                transitionName: "",
                maskTransitionName: "",
                mapgroupOptions: {
                    store: store,
                    setup: { operation: operation, id: id },
                    tab: tab,
                    type: type
                },
            })
        }
    }, [showResourcePicker]);

    return (
        <div className="create-group">
            <Button
                disabled={disabled}
                title={msg(type, operation)}
                className="button-update"
                size="small"
                type="text"
                onClick={onGroups}
                icon={icon === "add" ? <AddCircle /> : <Pencil />}
            >
                {text}
            </Button>
        </div>
    )
});