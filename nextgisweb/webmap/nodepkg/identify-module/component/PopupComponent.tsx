import { forwardRef, RefObject, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";
import { Rnd } from "react-rnd";
import { IdentifyStore } from "../IdentifyStore"
import { observer } from "mobx-react-lite";

import { FeatureComponent } from "./FeatureComponent"

interface VisibleProps {
    portal: boolean;
    overlay: boolean | undefined;
    key: string;
}
interface ResponseProps {
    featureCount: number;
    data: string;
}

interface PosProps {
    x: number;
    y: number;
}

interface PopupProps {
    width: number;
    height: number;
    visible: ({ portal, overlay, key }: VisibleProps) => void;
    coords: number[];
    response: ResponseProps;
    position: PosProps;
}

export default observer(forwardRef<HTMLInputElement>(function PopupComponent(props: PopupProps, ref: RefObject<HTMLInputElement>) {

    const { width, height, visible, coords, position, response } = props;
    const count = response.featureCount;

    const [store] = useState(() => new IdentifyStore());
    const [refRnd, setRefRnd] = useState();

    console.log(response);

    useEffect(() => {
        store.setValueRnd({ x: position.x, y: position.y, width: width, height: height })
    }, [position])

    return (
        createPortal(
            <Rnd
                dragHandleClassName="title-name"
                bounds="window"
                minWidth={width}
                minHeight={height}
                allowAnyClick={true}
                enableResizing={count > 0 ? true : false}
                position={{ x: store.valueRnd.x, y: store.valueRnd.y }}
                size={{ width: store.valueRnd.width, height: store.valueRnd.height }}
                onDragStop={(e, d) => {
                    store.setValueRnd(prev => ({ ...prev, x: d.x, y: d.y }));
                }}
                onResize={(e, direction, ref, delta, position) => {
                    store.setValueRnd(prev => ({ ...prev, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y }));
                }}
                ref={c => {
                    if (c) {
                        setRefRnd(c);
                        c.resizableElement.current.hidden = false;
                    }
                }}
            >
                <div ref={ref} className="popup-position" >
                    <div className="title">
                        <div className="title-name">Объектов: {count}</div>
                        <span
                            className="icon-symbol"
                            onClick={() => {
                                visible({ portal: true, overlay: undefined, key: "popup" })
                                refRnd.resizableElement.current.hidden = true;
                            }} >
                            <CloseIcon />
                        </span>
                    </div>
                    {count > 0 && (
                        <div className="content">
                            <FeatureComponent data={response.data} />
                        </div>
                    )}
                    <div className="footer-popup">{coords && coords[0].toFixed(6) + ", " + coords[1].toFixed(6)}</div>
                </div>
            </Rnd>,
            document.body
        )
    )
}));