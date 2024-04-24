import { forwardRef, RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";
import { useGeom } from "../hook/useGeom";
import MapBrowserEvent from 'ol/MapBrowserEvent';
import type { DojoDisplay } from "@nextgisweb/webmap/type";

interface VisibleProps {
    portal: boolean;
    overlay: boolean | undefined;
    key: string;
}

interface PopupProps {
    width: number;
    height: number;
    event: MapBrowserEvent;
    visible: ({ portal, overlay, key }: VisibleProps) => void;
    display: DojoDisplay;
}


export const PopupComponent = forwardRef<HTMLInputElement>((props: PopupProps, ref: RefObject<HTMLInputElement>) => {
    const [coords, setSoords] = useState(undefined);

    const { width, height, event, visible, tool } = props;
    const { displayFeatureInfo, toWGS84 } = useGeom(tool);
    // const { displayFeatureInfo } = useGraph();
    useEffect(() => {
        toWGS84(event, 3857).then(item => setSoords(item))
        displayFeatureInfo(event.pixel);
        
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
                        onClick={() => { visible({ portal: true, overlay: undefined, key: "popup" }) }}
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