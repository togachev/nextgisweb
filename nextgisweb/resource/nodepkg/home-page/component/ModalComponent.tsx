import { Modal } from "@nextgisweb/gui/antd";

export const ModalComponent = ({ title, form, open, handleCancel }) => {
    return (
        <Modal
            transitionName=""
            maskTransitionName=""
            styles={{ content: form.props.form ? { padding: "0 0 64px 0" } : { padding: 0 }, body: { padding: "0 16px 16px 16px", height: "calc(100vh - 300px)", overflowY: "auto" } }}
            centered
            footer={null}
            open={open}
            className="modal-component"
            width="70%"
            title={
                <div className="modal-title" >
                    {title}
                </div>
            }
            onCancel={handleCancel}
        >
            {form}
        </Modal>
    )
};