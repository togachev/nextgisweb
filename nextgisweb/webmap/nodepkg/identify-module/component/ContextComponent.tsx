import { forwardRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { usePointPopup } from "../hook/usePointPopup";
import { useOutsideClick } from "../hook/useOutsideClick";

interface PositionProps {
    x: number;
    y: number;
}

interface ContextProps {
    coordinate: number[];
    width: number;
    height: number;
    visible: boolean;
    event: EventTarget;
    opened: boolean;
}

export const ContextComponent = forwardRef<HTMLInputElement>((props: ContextProps, ref: RefObject<HTMLInputElement>) => {
    const { width, height, coordinate, event, opened } = props;
    const { positionPopup } = usePointPopup();
    useOutsideClick(ref, opened);

    const pos = positionPopup(event, width, height) as PositionProps;
    const array = [
        { key: 1, title: 'Действие 1', result: 'Действие 1 выполнено' },
        { key: 2, title: 'Действие 2', result: 'Действие 2 выполнено' },
        { key: 3, title: 'Действие 3', result: 'Действие 3 выполнено' },
        { key: 4, title: 'Действие 4', result: 'Действие 4 выполнено' },
    ]

    return (
        createPortal(
            <div ref={ref} className="context-position" style={{
                width: width,
                height: height,
                left: pos.x,
                top: pos.y,
                position: "absolute",
            }}>
                <div
                    onClick={() => { alert("Координаты скопированы") }}
                    className="context-coords"
                >{coordinate[0] + ", " + coordinate[1]}</div>
                {
                    array.map(item => {
                        return (
                            <div className="context-item" key={item.key} onClick={() => { alert(item.result) }} >
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
ContextComponent.displayName = "ContextComponent";