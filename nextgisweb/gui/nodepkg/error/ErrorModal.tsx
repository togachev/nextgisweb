import { useEffect, useState } from "react";

import { Modal } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import showModal from "../showModal";
import type { ParamsOf } from "../type";

import { extractError } from "./extractError";
import type { ErrorInfo } from "./extractError";
import { Body, Footer, TechInfo } from "./shared";

type ModalProps = ParamsOf<typeof Modal>;

export interface ErrorModalProps extends ModalProps {
    error: ErrorInfo;
}

const DEFAULTS = {
    centered: true,
    width: "40em",
    transitionName: "",
    maskTransitionName: "",
};

export function ErrorModal({
    error,
    open: open_,
    visible,
    ...props
}: ErrorModalProps) {
    const [open, setOpen] = useState(visible ?? open_ ?? true);
    const [tinfo, setTinfo] = useState(false);

    const close = () => setOpen(false);

    useEffect(() => {
        const isOpen = visible ?? open_;
        if (typeof isOpen === "boolean") {
            setOpen(isOpen);
        }
    }, [visible, open_]);

    const title =
        "title" in error && typeof error.title === "string"
            ? error.title
            : gettext("Error");

    return (
        <Modal
            {...DEFAULTS}
            {...props}
            title={title}
            open={open}
            destroyOnClose
            onCancel={() => setOpen(false)}
            footer={<Footer onOk={close} {...{ tinfo, setTinfo }} />}
        >
            <Body error={error} />
            {tinfo && <TechInfo error={error} />}
        </Modal>
    );
}

export function errorModal(error: unknown, props?: Partial<ErrorModalProps>) {
    if (ngwSentry && error instanceof Error) {
        ngwSentry.captureException(error);
    }
    return showModal(ErrorModal, { error: extractError(error), ...props });
}
