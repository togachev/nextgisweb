import { forwardRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useOutsideClick } from "../hook/useOutsideClick";

interface PositionProps {
    x: number;
    y: number;
}

interface ContextProps {
    width: number;
    height: number;
    coords: number[];
    position: PositionProps;
}

export default forwardRef<Element>(function ContextComponent(props: ContextProps, ref: RefObject<Element>) {

    const { width, height, coords, position } = props;
    useOutsideClick(ref, true);

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
                left: position.x,
                top: position.y,
                position: "absolute",
            }}>
                <div
                    onClick={() => { alert("Координаты скопированы") }}
                    className="context-coords"
                >{coords && coords[0].toFixed(6) + ", " + coords[1].toFixed(6)}</div>
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