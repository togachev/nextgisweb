import { forwardRef, RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";
import { useGeom } from "../hook/useGeom";

interface PopupProps {
    width: number;
    height: number;
    event: EventTarget;
    visible: (portal: boolean, overlay: boolean | undefined) => void;
}

export const PopupComponent = forwardRef<HTMLInputElement>((props: PopupProps, ref: RefObject<HTMLInputElement>) => {
    const [coords, setSoords] = useState(undefined);

    const { width, height, event, visible } = props;
    const { toWGS84 } = useGeom();

    useEffect(() => {
        toWGS84(event).then(item => setSoords(item))
    }, [event]);

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
                <div className="content">data</div>
                <div className="footer-popup">{coords && coords[0].toFixed(6) + ", " + coords[1].toFixed(6)}</div>
            </div>,
            document.body
        )
    )
});
PopupComponent.displayName = "PopupComponent";