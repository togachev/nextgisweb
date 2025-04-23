import { useRef, useState } from "react";
import { Modal } from "@nextgisweb/gui/antd";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";

export const ModalComponent = ({ title, form, open, handleCancel }) => {
    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef<HTMLDivElement>(null!);

    const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    return (
        <Modal
            transitionName=""
            maskTransitionName=""
            className="modal-component"
            styles={{ content: { padding: 0 }, body: { padding: 16 }}}
            width="max-content"
            centered
            footer={null}
            open={open}
            title={
                <div
                    className="modal-title"
                    onMouseOver={() => {
                        if (disabled) {
                            setDisabled(false);
                        }
                    }}
                    onMouseOut={() => {
                        setDisabled(true);
                    }}
                    // onFocus={() => { }}
                    // onBlur={() => { }}
                >
                    {title}
                </div>
            }
            onCancel={handleCancel}
            modalRender={(modal) => (
                <Draggable
                    disabled={disabled}
                    bounds={bounds}
                    nodeRef={draggleRef}
                    onStart={(event, uiData) => onStart(event, uiData)}
                >
                    <div ref={draggleRef}>{modal}</div>
                </Draggable>
            )}
        >
            {form}
        </Modal>
    )
};