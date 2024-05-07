import { forwardRef, RefObject, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";
import { Rnd } from "react-rnd";
import { IdentifyStore } from "../IdentifyStore";
import { observer } from "mobx-react-lite";
import { FeatureComponent } from "./FeatureComponent";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { gettext } from "@nextgisweb/pyramid/i18n";

interface VisibleProps {
    portal: boolean;
    overlay: boolean | undefined;
    key: string;
}
interface ResponseProps {
    featureCount: number;
    data: object;
    fields: object;
}

interface PosProps {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface RndProps {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface PopupProps {
    width: number;
    height: number;
    visible: ({ portal, overlay, key }: VisibleProps) => void;
    coords: number[];
    response: ResponseProps;
    position: PosProps;
}

export default observer(forwardRef<Element>(function PopupComponent(props: PopupProps, ref: RefObject<Element>) {
    const { copyValue, contextHolder } = useCopy();
    const { width, height, visible, coords, position, response } = props;
    const count = response.featureCount;
    console.log(position);
    
    const [store] = useState(() => new IdentifyStore({
        selected: response.data[0],
    }));

    const [refRnd, setRefRnd] = useState();
    const [valueRnd, setValueRnd] = useState<RndProps>({
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
    });

    useEffect(() => {
        setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
    }, [position])

    const coordValue = coords && coords[1].toFixed(6) + ", " + coords[0].toFixed(6);

    return (
        createPortal(
            <Rnd
                dragHandleClassName="title-name"
                // bounds="window"
                minWidth={position.width}
                minHeight={position.height}
                allowAnyClick={true}
                enableResizing={count > 0 ? true : false}
                position={{ x: valueRnd.x, y: valueRnd.y }}
                size={{ width: valueRnd.width, height: valueRnd.height }}
                onDragStop={(e, d) => {
                    setValueRnd(prev => ({ ...prev, x: d.x, y: d.y }));
                }}
                onResize={(e, direction, ref, delta, position) => {
                    setValueRnd(prev => ({ ...prev, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y }));
                }}
                ref={c => {
                    if (c) {
                        setRefRnd(c);
                        c.resizableElement.current.hidden = false;
                    }
                }}
            >
                {contextHolder}
                <div ref={ref} className="popup-position" >
                    <div className="title">
                        <div className="title-name">
                            <span className="object-select">Объектов: {count}</span>
                            {count > 0 && (
                                <span
                                    title={store.selected?.layer_name}
                                    className="layer-name">
                                    {store.selected?.layer_name}
                                </span>
                            )}
                        </div>
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
                            <FeatureComponent store={store} position={position} data={response.data} />
                        </div>
                    )}
                    <div className="footer-popup" onClick={() => { copyValue(coordValue, gettext("Coordinates copied")) }} >{coordValue}</div>
                </div>
            </Rnd>,
            document.body
        )
    )
}));