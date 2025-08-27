import { Modal } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { DeletePage } from "./DeletePage";
import type { DeleteConfirmModalProps } from "./type";

function DeleteConfirmModal({
    resources,
    onOkDelete,
    onCancelDelete,
    ...props
}: DeleteConfirmModalProps) {
    return (
        <Modal
            transitionName=""
            maskTransitionName=""
            footer={null}
            closable={false}
            destroyOnHidden
            title={gettext("Confirmation required")}
            {...props}
        >
            <DeletePage
                resources={resources}
                isModal={true}
                onCancel={onCancelDelete}
                onOk={onOkDelete}
            />
        </Modal>
    );
}

export default DeleteConfirmModal;
