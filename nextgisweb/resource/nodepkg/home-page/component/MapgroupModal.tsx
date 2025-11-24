import { Button, Modal } from "@nextgisweb/gui/antd";
import Delete from "@nextgisweb/icon/mdi/delete-outline";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { CompositeWidget } from "@nextgisweb/resource/composite";
import "@nextgisweb/resource/composite/CompositeWidget.less";
import { MouseEvent, useCallback, useEffect, useState } from "react";
import { HomeStore } from "../HomeStore";

export type CompositeSetup =
    | { operation: "create"; cls: string; parent: number }
    | { operation: "update"; id: number };

interface CompositeWidgetProps {
    store?: HomeStore;
    setup?: CompositeSetup;
    tab?: string;
    type?: string;
    title?: string;
}

export type ModalProps = Parameters<typeof Modal>[0];

export interface MapgroupModalProps extends ModalProps {
    open?: boolean;
    onCancel?: (e?: any) => void;
    options?: CompositeWidgetProps;
}

export const MapgroupModal = ({
    open: openProp,
    options,
    onCancel,
    ...modalProps
}: MapgroupModalProps) => {
    const [open, setOpen] = useState(openProp);
    const [save, setSave] = useState(false);
    const { store, setup, tab, type, title } = options || {};
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

    useEffect(() => {
        setOpen(openProp);
        setSave(false);
    }, [openProp]);

    useEffect(() => {
        if (save === true) {
            setOpen(false);
            store?.reload();
        }
    }, [save]);

    return (
        <>
            <Modal
                className="modal-component"
                width="70%"
                title={
                    <div className="modal-title" >
                        {title}
                    </div>
                }
                centered={true}
                open={open}
                destroyOnHidden
                styles={{ content: { padding: 0 }, body: { padding: 16, height: "calc(100vh - 300px)", overflowY: "auto" } }}
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
                <CompositeWidget setup={setup} tab={tab} location="true" setSave={setSave} />
            </Modal>
            {contextHolder}
        </>
    );
}
