import { forwardRef, RefObject, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@nextgisweb/icon/material/close";
import { Rnd } from "react-rnd";
import { Select, Tooltip } from "@nextgisweb/gui/antd";
import { IdentifyStore } from "../IdentifyStore";
import { observer } from "mobx-react-lite";
import { FeatureComponent } from "./FeatureComponent";
import { CoordinateComponent } from "./CoordinateComponent";
import { useSource } from "../hook/useSource";
import type { DojoDisplay } from "@nextgisweb/webmap/type";

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
    const imodule = display.identify_module
    const [refRnd, setRefRnd] = useState();
    const [valueRnd, setValueRnd] = useState<Rnd>({
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
    });

    const { getAttribute } = useSource();

    const count = response.featureCount;

    const [store] = useState(() => new IdentifyStore({
        data: response.data,
    }));
    imodule.identifyStore = store;

    useEffect(() => {
        if (store.update)
            getAttribute(store.selected)
                .then(item => {
                    store.setAttribute(item._fieldmap);
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
                    store.setUpdate(false);
                });
    }, [store.update]);

    useEffect(() => {
        setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
        if (count > 0) {
            store.setData(response.data);
            store.setSelected(response.data[0]);
            getAttribute(response.data[0])
                .then(item => {
                    store.setAttribute(item._fieldmap);
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
                });
        } else {
            store.setData([]);
            store.setAttribute(null);
            store.setFeature(null);
            topic.publish("feature.unhighlight");
        }
    }, [response]);

    const currentLayer = store.selected !== null ? store.selected.layer_name : undefined

    const onChange = (value: number) => {
        const selectedValue = store.data.find(item => item.value === value);

        store.setSelected(selectedValue);
        getAttribute(selectedValue)
            .then(item => {
                store.setAttribute(item._fieldmap);
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
            });
    };
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
                cancel={".select-feature,.ant-tabs-nav,.value-link,.value-email,.ant-tabs-nav,.icon-symbol,.coordinate-value" + moveClass}
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
                                <Tooltip title={currentLayer}>
                                    <span
                                        title={currentLayer}
                                        className="layer-name">
                                        {currentLayer}
                                    </span>
                                </Tooltip>
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
                    {count > 0 && store.selected !== null && (
                        <>
                            <div className="select-feature" >
                                <Select
                                    placement="topLeft"
                                    optionFilterProp="children"
                                    filterOption={(input, option) => (option?.label ?? "").includes(input)}
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.label ?? "").toLowerCase().localeCompare((optionB?.label ?? "").toLowerCase())
                                    }
                                    showSearch
                                    size="small"
                                    value={store.selected}
                                    style={{ width: "100%" }}
                                    onChange={onChange}
                                    options={store.data}
                                />
                            </div>
                            <div className="content">
                                <FeatureComponent display={display} store={store} attribute={store.attribute} position={valueRnd} />
                            </div>
                        </>
                    )}
                    <div className="footer-popup">
                        <CoordinateComponent coordValue={coordValue} />
                    </div>
                </div>
            </Rnd>,
            document.body
        )
    )
}));