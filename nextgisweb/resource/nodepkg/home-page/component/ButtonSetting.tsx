import { ReactElement, useCallback } from "react";
import { Button, Modal } from "@nextgisweb/gui/antd";
import showModal from "@nextgisweb/gui/showModal";
import AddCircle from "@nextgisweb/icon/material/add_circle";
import Pencil from "@nextgisweb/icon/mdi/pencil-outline";
import Cog from "@nextgisweb/icon/mdi/cog";
import { isMobile as isM } from "@nextgisweb/webmap/mobile/selectors";

import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";

import "@nextgisweb/resource/composite/CompositeWidget.less";
import { observer } from "mobx-react-lite";
import { HomeStore } from "../HomeStore";
import { msg } from "./msg";
import { ModalMapgroup } from "./ModalMapgroup";

interface StoreProps {
    store: HomeStore;
    iconKey?: string;
    operation: string;
    id?: number;
    type: string;
    tab?: string;
    text?: string;
    disabled?: boolean;
    selectedId?: number;
    webmap_name?: string;
    expanded_indexes?: number[];
}

export type CompositeSetup =
    | { operation: "create"; cls: string; parent: number }
    | { operation: "update"; id: number; selectedId: number };

interface CompositeWidgetProps {
    store?: HomeStore;
    setup?: CompositeSetup;
    tab?: string;
    type?: string;
    selectedId?: number;
}

interface IconCompProps {
    [key: string]: ReactElement;
}

export type ModalProps = Parameters<typeof Modal>[0];

export interface MapgroupModalProps extends ModalProps {
    options?: CompositeWidgetProps;
}

export const ButtonSetting = observer((props: StoreProps) => {
    const { showResourcePicker } = useResourcePicker({ initParentId: 0 });
    const { id, iconKey, store, type, operation, tab, text, disabled, selectedId, webmap_name, expanded_indexes } = props;
    
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
                    return showModal(ModalMapgroup, {
                        transitionName: "",
                        maskTransitionName: "",
                        width: isM ? "100%" : "75%",
                        options: {
                            store: store,
                            setup: setup,
                            tab: tab,
                            title: msg(type, operation),
                            height: isM ? "90vh" : "70vh",
                            padding: isM && "32px 6px 6px 6px"
                        },
                    });
                },
            })
        } else {
            showModal(ModalMapgroup, {
                transitionName: "",
                maskTransitionName: "",
                width: isM ? "100%" : "75%",
                options: {
                    store: store,
                    setup: { operation: operation, expanded_indexes: expanded_indexes, id: id, selectedId: selectedId },
                    tab: tab,
                    type: type,
                    title: type === "group" ? store.allLoadedResources.get(id).resource.display_name : webmap_name,
                    location: "true",
                    height: isM ? "90vh" : "70vh",
                    padding: isM && "32px 6px 6px 6px"
                },
            })
        }
    }, [showResourcePicker]);

    const iconComp = (key?: string) => {
        const icon: IconCompProps = {
            add: <AddCircle />,
            edit: <Pencil />,
            map_edit: <Cog />,
        }
        return key ? icon[key] : <></>;
    }

    return (
        <div className="create-group">
            <Button
                disabled={disabled}
                title={msg(type, operation)}
                size="small"
                type="text"
                onClick={onGroups}
                icon={iconComp(iconKey)}
            >
                {text}
            </Button>
        </div>
    )
});