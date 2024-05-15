import { forwardRef, RefObject, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@nextgisweb/icon/material/close";
import { Rnd } from "react-rnd";
import { Divider } from "@nextgisweb/gui/antd";
import { IdentifyStore } from "../IdentifyStore";
import { observer } from "mobx-react-lite";
import { FeatureComponent } from "./FeatureComponent";
import { CoordinateComponent } from "./CoordinateComponent";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import type { DojoDisplay } from "../../type";

import topic from "dojo/topic";
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
    display: DojoDisplay;
}

export default observer(forwardRef<Element>(function PopupComponent(props: Params, ref: RefObject<Element>) {
    const { params, visible, display } = props;
    const { coordValue, position, response } = params;
    const count = response.featureCount;
    const { copyValue, contextHolder } = useCopy();

    const [store] = useState(() => new IdentifyStore({}));

    useEffect(() => {
        count === 0 && topic.publish("feature.unhighlight");
        response.data[0] && store.setSelected(response.data[0]);
    }, [response.data[0]])

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

    const moveClass = store.styleContent === false ? ",.ant-tabs-content-holder" : "";

    return (
        createPortal(
            <Rnd
                resizeHandleClasses={{
                    right: "hover-right",
                    left: "hover-left",
                    top: "hover-top",
                    bottom: "hover-bottom",
                    bottomRight: "hover-angle-bottom-right",
                    bottomLeft: "hover-angle-bottom-left",
                    topRight: "hover-angle-top-right",
                    topLeft: "hover-angle-top-left",
                }}
                cancel={".select-feature,.ant-tabs-nav,.icon-symbol,.coordinate-value" + moveClass}
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
                            {count > 0 && store.selected && (
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
                                topic.publish("feature.unhighlight");
                            }} >
                            <CloseIcon />
                        </span>
                    </div>
                    {count > 0 && store.selected ? (
                        <>
                            <FeatureComponent display={display} store={store} position={position} data={response.data} />
                            <Divider style={{ margin: 0 }} />
                        </>
                    ) : <Divider style={{ margin: 0 }} />}
                    <div className="footer-popup">
                        <CoordinateComponent coordValue={coordValue} />
                    </div>
                </div>
            </Rnd>,
            document.body
        )
    )
}));