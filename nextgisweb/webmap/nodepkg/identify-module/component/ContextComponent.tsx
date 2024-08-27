import { forwardRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useOutsideClick } from "../hook/useOutsideClick";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { CoordinateComponent } from "./CoordinateComponent";

import type { Params } from "./type";

export default forwardRef<Element>(function ContextComponent(props: Params, ref: RefObject<Element>) {
    const { params, visible, display, array_context } = props;
    const { position } = params;
    useOutsideClick(ref, true);
    const { contextHolder } = useCopy();
    return (
        createPortal(
            <div key={new Date} ref={ref} className="context-position" style={{
                width: position.width,
                left: position.x,
                top: position.y,
                position: "absolute",
            }}>
                {contextHolder}
                <span
                    onClick={() => {
                        visible({ hidden: true, overlay: undefined, key: "context" });
                    }}
                >
                    <CoordinateComponent display={display} op="context" />
                </span>
                {
                    array_context.map(item => {
                        if (item.visible) {
                            return (
                                <div className="context-item" key={item.key} onClick={() => {
                                    visible({ hidden: true, overlay: undefined, key: "context" });
                                }} >
                                    <span>{item.title}</span>
                                </div>
                            )
                        }
                    })
                }
            </div>,
            document.body
        )
    )
});