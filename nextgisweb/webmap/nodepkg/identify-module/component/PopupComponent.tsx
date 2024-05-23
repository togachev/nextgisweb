import { forwardRef, RefObject, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";
import { Rnd } from "react-rnd";
import { Button, ConfigProvider, Select, Tooltip } from "@nextgisweb/gui/antd";
import { IdentifyStore } from "../IdentifyStore";
import { observer } from "mobx-react-lite";
import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";
import { DisplayItemConfig } from "@nextgisweb/webmap/panels-manager/type";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ContentComponent } from "./ContentComponent";
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
    const { position, response } = params;
    const imodule = display.identify_module;
    const [refRnd, setRefRnd] = useState();
    const [valueRnd, setValueRnd] = useState<Rnd>({
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
    });

    const { generateUrl, getAttribute } = useSource();

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
            store.setContextUrl(generateUrl(display, { res: response.data[0] }));
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
            store.setContextUrl(generateUrl(display, { res: null }));
            store.setData([]);
            store.setAttribute(null);
            store.setFeature(null);
            topic.publish("feature.unhighlight");
        }
    }, [response]);

    const currentLayer = store.selected !== null ? store.selected.layer_name : undefined

    const onChange = (value: { value: number; label: string }) => {
        const selectedValue = store.data.find(item => item.value === value.value);
        store.setSelected(selectedValue);
        store.setContextUrl(generateUrl(display, { res: selectedValue }));
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

    const filterOption = (input: string, option?: { label: string; value: string; layer_name: string }) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
        (option?.layer_name ?? '').toLowerCase().includes(input.toLowerCase());
    
    let operations;
    count > 0 && store.selected && Object.values(display._itemConfigById).forEach((config: DisplayItemConfig) => {
        const { id, layerId, styleId } = store.selected;
        if (
            config.layerId !== layerId ||
            config.styleId !== styleId ||
            !imodule._isEditEnabled(display, config)
        ) {
            return;
        }
        const onSave = () => {
            store.setUpdate(true);
            topic.publish("feature.updated", {
                resourceId: layerId,
                featureId: id,
            });
        }
        operations = (
            <Tooltip title={gettext("Edit")}>
                <Button
                    type="text"
                    className="edit-symbol"
                    icon={<EditNote />}
                    onClick={() => {
                        const featureId = id;
                        const resourceId = layerId;
                        showModal(FeatureEditorModal, {
                            editorOptions: {
                                featureId,
                                resourceId: resourceId,
                                onSave: () => {
                                    if (onSave) {
                                        onSave();
                                    }
                                },
                            },
                        });

                    }}
                />
            </Tooltip>
        );
    })

    const offHP = 40;
    const offset = display.clientSettings.offset_point;

    const W = display.mapNode.clientWidth - offset * 2;
    const H = display.mapNode.clientHeight - offset * 2;

    const fX = display.panelsManager._activePanelKey ?
        display.leftPanelPane.w + offHP + offset :
        offHP + offset;
    const fY = offHP + offset;

    return (
        createPortal(
            <ConfigProvider
                theme={{
                    components: {
                        Dropdown: {
                            paddingBlock: 5,
                            controlPaddingHorizontal: 5,
                            controlItemBgActiveHover: "var(--divider-color)",
                            colorPrimary: "var(--text-base)",
                            lineHeight: 1,
                        },
                        Radio: {
                            buttonPaddingInline: 3,
                            buttonSolidCheckedBg: "var(--icon-color)",
                            buttonSolidCheckedHoverBg: "var(--text-secondary)",
                            colorPrimary: "var(--primary)",
                            colorBorder: "var(--divider-color)",
                            borderRadius: 4,
                            controlHeight: 24,
                            fontSize: 16,
                            lineWidth: 1,
                            lineHeight: 1,
                            paddingXS: 50
                        },
                        Tooltip: {
                            colorBgSpotlight: "#fff",
                            colorTextLightSolid: "#000",
                            borderRadius: 3,
                        },
                        Select: {
                            optionSelectedBg: "var(--divider-color)",
                            colorPrimaryHover: "var(--divider-color)",
                            colorPrimary: "var(--text-secondary)",
                            controlOutline: "var(--divider-color)",
                            colorBorder: "var(--divider-color)",
                        },
                        Button: {
                            colorLink: "var(--text-base)",
                            colorLinkHover: "var(--primary)",
                            defaultHoverColor: "var(--primary)",
                        }
                    }
                }}
            >
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
                    cancel=".select-feature,.radio-block,.radio-group,.value-link,.value-email,.icon-symbol,.coordinate-value,.content-item"
                    bounds={valueRnd.width === W ? undefined : "window"}
                    minWidth={position.width}
                    minHeight={position.height}
                    allowAnyClick={true}
                    enableResizing={count > 0 ? true : false}
                    position={{ x: valueRnd.x, y: valueRnd.y }}
                    size={{ width: valueRnd.width, height: valueRnd.height }}
                    onDragStop={(e, d) => {
                        setValueRnd(prev => ({ ...prev, x: d.x, y: d.y }));
                        if (valueRnd.width === W && valueRnd.height === H) {
                            setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                            store.setFullscreen(true);
                        }
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
                            <div className="title-name"
                                onClick={(e) => {
                                    if (count > 0 && e.detail === 2) {
                                        setTimeout(() => {
                                            if (valueRnd.width > position.width || valueRnd.height > position.height) {
                                                setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                                store.setFullscreen(false)
                                            } else {
                                                setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                                store.setFullscreen(true)
                                            }
                                        }, 200)
                                    }
                                }}
                            >
                                <span className="object-select">Объектов: {count}</span>
                                {count > 0 && (
                                    <span
                                        title={currentLayer}
                                        className="layer-name">
                                        {currentLayer}
                                    </span>
                                )}
                            </div>
                            {count > 0 && (<span
                                title={store.fullscreen === true ? gettext("Close fullscreen popup") : gettext("Open fullscreen popup")}
                                className="icon-symbol"
                                onClick={() => {
                                    if (valueRnd.width > position.width || valueRnd.height > position.height) {
                                        setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                        store.setFullscreen(false)
                                    } else {
                                        setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                        store.setFullscreen(true)
                                    }
                                    if (valueRnd.width < W && valueRnd.width > position.width || valueRnd.height < H && valueRnd.height > position.height) {
                                        setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                        store.setFullscreen(true)
                                    }
                                }} >
                                {store.fullscreen === true ? (<CloseFullscreen />) : (<OpenInFull />)}
                            </span>)}
                            <span
                                title={gettext("Close")}
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
                                        labelInValue
                                        placement="topLeft"
                                        optionFilterProp="children"
                                        filterOption={filterOption}
                                        filterSort={(optionA, optionB) =>
                                            (optionA?.label ?? "").toLowerCase().localeCompare((optionB?.label ?? "").toLowerCase())
                                        }
                                        showSearch
                                        size="small"
                                        value={store.selected}
                                        style={{ width: operations ? "calc(100% - 26px)" : "100%", padding: "0px 2px 0px 2px" }}
                                        onChange={onChange}
                                        options={store.data}
                                        optionRender={(option) => (
                                            <div className="label-select">
                                                <Tooltip title={option.data.label}>
                                                    <div className="label-feature">
                                                        {option.data.label}
                                                    </div>
                                                </Tooltip>
                                                <Tooltip title={option.data.layer_name}>
                                                    <div className="label-style">
                                                        {option.data.layer_name}
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        )}
                                    />
                                    {operations}
                                </div>
                                <div className="content">
                                    <ContentComponent store={store} attribute={store.attribute} position={valueRnd} />
                                </div>
                            </>
                        )}
                        <div className="footer-popup">
                            <CoordinateComponent display={display} link={store.contextUrl} count={count} op="popup" />
                        </div>
                    </div>
                </Rnd >
            </ConfigProvider>,
            document.body
        )
    )
}));