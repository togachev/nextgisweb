import { forwardRef, RefObject, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@nextgisweb/icon/material/close";
import { Rnd } from "react-rnd";
import { IdentifyStore } from "../IdentifyStore";
import { observer } from "mobx-react-lite";
import { FeatureComponent } from "./FeatureComponent";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { gettext } from "@nextgisweb/pyramid/i18n";

interface Visible {
    hidden: boolean;
    overlay: boolean | undefined;
    key: string;
}
interface Response {
    featureCount: number;
    data: object;
    fields: object;
}

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Rnd {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Props {
    coordValue: string;
    response: Response;
    position: Position;
}

interface Params {
    params: Props;
    visible: ({ hidden, overlay, key }: Visible) => void;
}

export type HandleStyles = {
    bottom?: -10,
    left?: -10,
    width?: 15,
    heght?: 15,
    right?: -10,
    top?: -10,
}

export default observer(forwardRef<Element>(function PopupComponent(props: Params, ref: RefObject<Element>) {

    const { params, visible } = props;
    const { coordValue, position, response } = params;
    const count = response.featureCount;
    const { copyValue, contextHolder } = useCopy();

    const [store] = useState(() => new IdentifyStore({
        selected: response.data[0],
    }));

    const [refRnd, setRefRnd] = useState();
    const [valueRnd, setValueRnd] = useState<Rnd>({
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
    });

    useEffect(() => {
        setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
    }, [position])

    return (
        createPortal(
            <Rnd
                resizeHandleClasses={{
                    right: "hover-right",
                    left: "hover-left",
                    top: "hover-top",
                    bottom: "hover-bottom",
                    bottomRight: "hover-angle",
                    bottomLeft: "hover-angle",
                    topRight: "hover-angle",
                    topLeft: "hover-angle",
                }}
                cancel=".select-feature,.ant-tabs-nav,.ant-tabs-content-holder,.icon-symbol,.coordinate-value"
                bounds="window"
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
                                visible({ hidden: true, overlay: undefined, key: "popup" })
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
                    <div className="footer-popup"  >
                        <span className="coordinate-value" title={gettext("Copy coordinates")} onClick={() => { copyValue(coordValue, gettext("Coordinates copied")) }}>{coordValue}</span>
                    </div>
                </div>
            </Rnd>,
            document.body
        )
    )
}));