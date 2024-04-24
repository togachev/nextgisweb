import { forwardRef, RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";
import { useGeom } from "../hook/useGeom";

interface PopupProps {
    coordinate: number[];
    width: number;
    height: number;
    event: EventTarget;
    visible: (portal: boolean, overlay: boolean | undefined) => void;
}

export const PopupComponent = forwardRef<HTMLInputElement>((props: PopupProps, ref: RefObject<HTMLInputElement>) => {
    const { coordinate, width, height, event, visible } = props;
    const { transformFrom } = useGeom();

    const [coords, setSoords] = useState();
    useEffect(() => {
        transformFrom(event, 3857)
            .then((response) => setSoords(response))
            .catch((error) => setSoords(error.message))
    }, []);
    console.log(coords);
    
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
                <div className="content">{coords && coords[0] + ", " + coords[1]}</div>
            </div>,
            document.body
        )
    )
});
PopupComponent.displayName = "PopupComponent";