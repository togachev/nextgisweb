import { forwardRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useOutsideClick } from "../hook/useOutsideClick";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { CoordinateComponent } from "./CoordinateComponent";
import type { DojoDisplay } from "@nextgisweb/webmap/type";

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Props {
    response: Response;
    position: Position;
}

interface Visible {
    hidden: boolean;
    overlay: boolean | undefined;
    key: string;
}

interface Params {
    params: Props;
    visible: ({ hidden, overlay, key }: Visible) => void;
    display: DojoDisplay;
}

export default forwardRef<Element>(function ContextComponent(props: Params, ref: RefObject<Element>) {
    const { params, visible, display } = props;
    const { position } = params;
    useOutsideClick(ref, true);
    const { contextHolder } = useCopy();

    const array = [
        { key: 1, title: 'Действие 1', result: 'Действие 1 выполнено' },
        { key: 2, title: 'Действие 2', result: 'Действие 2 выполнено' },
        { key: 3, title: 'Действие 3', result: 'Действие 3 выполнено' },
        { key: 4, title: 'Действие 4', result: 'Действие 4 выполнено' },
    ]

    return (
        createPortal(
            <div key={new Date} ref={ref} className="context-position" style={{
                width: position.width,
                height: position.height,
                left: position.x,
                top: position.y,
                position: "absolute",
            }}>
                {contextHolder}
                <span onClick={() => { visible({ hidden: true, overlay: undefined, key: "context" }); }}>
                    <CoordinateComponent display={display} op="context" />
                </span>
                {
                    array.map(item => {
                        return (
                            <div className="context-item" key={item.key} onClick={() => {
                                console.log(item.result);
                                visible({ hidden: true, overlay: undefined, key: "context" });
                            }} >
                                <span>{item.title}</span>
                            </div>
                        )
                    })
                }
            </div>,
            document.body
        )
    )
});