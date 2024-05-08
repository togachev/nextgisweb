import { forwardRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useOutsideClick } from "../hook/useOutsideClick";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { gettext } from "@nextgisweb/pyramid/i18n";

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Item {
    coordValue: string;
    position: Position;
}

interface Context {
    params: Item;
}

export default forwardRef<Element>(function ContextComponent(props: Context, ref: RefObject<Element>) {
    const { params } = props;
    const { coordValue, position } = params;
    useOutsideClick(ref, true);
    const { copyValue, contextHolder } = useCopy();

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
                <div
                    
                    title={gettext("Copy coordinates")}
                    onClick={() => { copyValue(coordValue, gettext("Coordinates copied")) }}
                    className="context-coords"
                >{coordValue}</div>
                {
                    array.map(item => {
                        return (
                            <div className="context-item" key={item.key} onClick={() => { console.log(item.result) }} >
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