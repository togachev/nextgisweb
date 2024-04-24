import { forwardRef, RefObject } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";

interface PopupProps {
    coordinate: number[];
    width: number;
    height: number;
    visible: (portal: boolean, overlay: boolean | undefined) => void;
}

export const PopupComponent = forwardRef<HTMLInputElement>((props: PopupProps, ref: RefObject<HTMLInputElement>) => {
    const { coordinate, width, height, visible } = props;
    return (
        createPortal(
            <div ref={ref} className="popup-position"
                style={{
                    width: width,
                    height: height,
                }}
            >
                <div className="title">
                    <div className="title-name">Атрибутивные данные объекта</div>
                    <span className="icon-symbol"
                        onClick={() => { visible(true, undefined) }}
                    ><CloseIcon /></span>
                </div>
                <div className="content">{coordinate[0] + ", " + coordinate[1]}</div>
            </div>,
            document.body
        )
    )
});
PopupComponent.displayName = "PopupComponent";