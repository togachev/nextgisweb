import { forwardRef, RefObject, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@nextgisweb/icon/material/close";
import { Rnd } from "react-rnd";
import { Divider } from "@nextgisweb/gui/antd";
import { IdentifyStore } from "../IdentifyStore";
import { observer } from "mobx-react-lite";
import { FeatureComponent } from "./FeatureComponent";
import { CoordinateComponent } from "./CoordinateComponent";
import { useSource } from "../hook/useSource";
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

    const [refRnd, setRefRnd] = useState();
    const [valueRnd, setValueRnd] = useState<Rnd>({
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
    });

    const { getAttribute } = useSource();

    const count = response.featureCount;

    const [store] = useState(() => new IdentifyStore({}));

    useEffect(() => {
        setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
        count > 0 ?
            (
                store.setData(response.data),
                store.setSelected(response.data[0]),
                getAttribute(response.data[0])
                    .then(item => {
                        console.log(item)
                        store.setAttribute({ [item.feature.id + "/" + item.resourceId]: item._fieldmap });
                        store.setFeature({
                            geom: item.feature.geom,
                            featureId: item.feature.id,
                            layerId: item.resourceId,
                        });
                        topic.publish("feature.highlight", {
                            geom: item.feature.geom,
                            featureId: item.feature.id,
                            layerId: item.resourceId,
                        })
                    })
            ) :
            (
                store.setData(null),
                store.setAttribute(null),
                store.setFeature(null),
                topic.publish("feature.unhighlight")
            )
    }, [count, position]);

    const moveClass = store.styleContent === false ? ",.ant-tabs-content-holder" : "";
    const currentLayer = store.data && store.data.length > 0 && store.data?.find(item => {
        if (store.attribute !== null && item.value === Object.keys(store.attribute)[0]) {
            return item
        }
    })
    console.log(count);

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
                <div ref={ref} className="popup-position" >
                    <div className="title">
                        <div className="title-name">
                            <span className="object-select">Объектов: {count}</span>
                            {count > 0 && (
                                <span
                                    title={currentLayer?.layer_name}
                                    className="layer-name">
                                    {currentLayer?.layer_name}
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
                    {count > 0 && store.data && store.data.length > 0 ? (
                        <>
                            <FeatureComponent display={display} store={store} position={position} />
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