import { useCallback, useEffect, useState } from "react";
import { Modal } from "@nextgisweb/gui/antd";

import topic from "@nextgisweb/webmap/compat/topic";
import { CompositeWidget } from "@nextgisweb/resource/composite";
import "@nextgisweb/resource/composite/CompositeWidget.less";
import { HomeStore } from "../HomeStore";

export type CompositeSetup =
    | { operation: "create"; cls: string; parent: number }
    | { operation: "update"; id: number };

interface CompositeWidgetProps {
    store?: HomeStore;
    setup?: CompositeSetup;
}

export type ModalProps = Parameters<typeof Modal>[0];

export interface MapgroupModalProps extends ModalProps {
    mapgroupOptions?: CompositeWidgetProps;
}

export const MapgroupModal = ({
    open: openProp,
    mapgroupOptions,
    onCancel,
    ...modalProps
}: MapgroupModalProps) => {
    const [open, setOpen] = useState(openProp);
    const { store, setup, tab } = mapgroupOptions || {};
    const [modal, contextHolder] = Modal.useModal();
    
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
                footer={null}
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
