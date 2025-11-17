import { MouseEvent, useCallback, useEffect, useState } from "react";
import { Button, Modal } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import topic from "@nextgisweb/webmap/compat/topic";
import { CompositeWidget } from "@nextgisweb/resource/composite";
import "@nextgisweb/resource/composite/CompositeWidget.less";
import { HomeStore } from "../HomeStore";
import Delete from "@nextgisweb/icon/mdi/delete-outline";

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
    open?: boolean;
    onCancel?: (e?: any) => void;
    mapgroupOptions?: CompositeWidgetProps;
}

export const MapgroupModal = ({
    open: openProp,
    mapgroupOptions,
    onCancel,
    ...modalProps
}: MapgroupModalProps) => {
    const [open, setOpen] = useState(openProp);
    const { store, setup, tab, type } = mapgroupOptions || {};
    const [modal, contextHolder] = Modal.useModal();

    const close = () => {
        setOpen(false);
    };

    const handleClose = useCallback(
        (e: MouseEvent<HTMLButtonElement, MouseEvent>) => {
            const close_ = () => {
                onCancel?.(e);
                close();
            };
            close_();
        },
        [modal, onCancel]
    );

    topic.subscribe("mapgroup.close.modal", () => {
        setOpen(false);
        store?.reload()
    });

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
                footer={type === "group" ? [
                    <Button key="delete" icon={<Delete />} type="text" danger onClick={() => {
                        if (setup?.operation === "update") {
                            store?.deleteGroup(setup.id)
                            setOpen(false);
                        }
                    }}>
                        {gettext("Delete group")}
                    </Button>,
                ] : []}
                closable={false}
                onCancel={handleClose}
                {...modalProps}
            >
                <CompositeWidget setup={setup} tab={tab} location="true" />
            </Modal>
            {contextHolder}
        </>
    );
}
