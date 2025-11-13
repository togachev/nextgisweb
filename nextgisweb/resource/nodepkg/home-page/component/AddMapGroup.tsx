import { Button, Modal } from "@nextgisweb/gui/antd";
import showModal from "@nextgisweb/gui/showModal";
import AddCircle from "@nextgisweb/icon/material/add_circle";
import { assert } from "@nextgisweb/jsrealm/error";
import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";
import { CompositeWidget } from "@nextgisweb/resource/composite";
import "@nextgisweb/resource/composite/CompositeWidget.less";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { EmptyComponent } from ".";
import type { FeatureEditorWidgetProps } from "../feature-editor/type";
import { HomeStore } from "../HomeStore";
import { msgEmty } from "./msg";
interface StoreProps {
    store: HomeStore;
    icon?: boolean;
}


export type ModalProps = Parameters<typeof Modal>[0];

export interface FeatureEditorModalProps extends ModalProps {
    editorOptions?: FeatureEditorWidgetProps;
}

export function MapgroupModal({
    open: openProp,
    editorOptions,
    onCancel,
    ...modalProps
}) {
    const [open, setOpen] = useState(openProp);
    const { parent } =
        editorOptions || {};
    const [modal, contextHolder] = Modal.useModal();

    assert(typeof parent === "number");

    const close = () => {
        setOpen(false);
    };

    const handleClose = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            const close_ = () => {
                onCancel?.(e);
                close();
            };
            close_();
        },
        [modal, onCancel]
    );

    useEffect(() => {
        setOpen(openProp);
    }, [openProp]);

    return (
        <>
            <Modal
                transitionName=""
                maskTransitionName=""
                className="mapgroup-modal"
                width=""
                centered={true}
                open={open}
                destroyOnHidden
                footer={null}
                closable={false}
                onCancel={handleClose}
                {...modalProps}
            >
                <CompositeWidget setup={{ operation: "create", cls: "mapgroup_resource", parent: parent }} location="true" />
            </Modal>
            {contextHolder}
        </>
    );
}


export const AddMapGroup = observer((props: StoreProps) => {
    const { showResourcePicker } = useResourcePicker({ initParentId: 0 });
    const { icon } = props;
    const onGroups = useCallback(() => {
        showResourcePicker({
            pickerOptions: {
                requireClass: "resource_group",
                initParentId: 0,
                clsFilter: "add_mapgroup_group",
            },
            onSelect: (resourceId: number) => {
                showModal(MapgroupModal, {
                    transitionName: "",
                    maskTransitionName: "",
                    editorOptions: {
                        parent: resourceId,
                    },
                });
            },
        });
    }, [showResourcePicker]);

    return (
        <div className="create-group">
            <Button type="text" onClick={onGroups} icon={icon ? <AddCircle /> : undefined} >
                <EmptyComponent {...{ text: msgEmty("group") }} /></Button>
        </div>
    )
});