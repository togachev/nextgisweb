import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo } from "react";
import { Button, ConfigProvider, Select } from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { createPortal } from "react-dom";

import { ButtonZoomComponent } from "./ButtonZoomComponent";
import { ContentComponent } from "./ContentComponent";
import { CoordinateComponent } from "./CoordinateComponent";
import topic from "@nextgisweb/webmap/compat/topic";
import { getEntries } from "../util/function";
import { PopupStore } from "../PopupStore";
import showModal from "@nextgisweb/gui/showModal";
import FeatureEditorModal from "@nextgisweb/feature-layer/feature-editor-modal";

import CloseIcon from "@nextgisweb/icon/material/close";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import Pin from "@nextgisweb/icon/mdi/pin";
import PinOff from "@nextgisweb/icon/mdi/pin-off";
import EditNote from "@nextgisweb/icon/material/edit_note";

import type SelectedFeatureStore from "@nextgisweb/webmap/panel/selected-feature/SelectedFeatureStore";
import type { Display } from "@nextgisweb/webmap/display";

import "./Popup.less";

interface PopupProps {
    display: Display;
    store: PopupStore;
}

const { Option } = Select;
const forbidden = gettext("The data is not available for reading");

const CheckOnlyOne = ({ store }) => {
    const msgFixPopup = gettext("Lock popup position");
    const msgFixOffPopup = gettext("Disable lock popup position");

    const onClick = useCallback((e) => {
        e.preventDefault();
        store.setFixPopup(!store.fixPopup);
    }, []);

    const props = {
        icon: store.fixPopup ? <PinOff /> : <Pin />,
        onTouchEnd: onClick,
        onClick: onClick,
        type: "text",
        variant: "filled",
        size: store.size,
        color: store.fixPopup && "primary",
        title: store.fixPopup ? msgFixOffPopup : msgFixPopup,
        className: !store.fixPopup ? "icon-symbol" : "icon-checked",
    }

    return (<Button {...props} />);
};

export const Popup = observer(
    (props: PopupProps) => {
        const { display, store } = props;


        const pm = display.panelManager;
        const pkey = "selected-feature";
        const panel = pm.getPanel<SelectedFeatureStore>(pkey);
        const contentProps = { store: store, display: display };
        const coordinateProps = { display: display, store: store, point: false };

        useEffect(() => {
            if (store.fixPopup) {
                store.setFixPos(store.valueRnd);
                store.setFixPanel(store.fixContentItem?.key)
            } else {
                store.setFixPos(null);
            }
        }, [store.fixPopup]);

        useEffect(() => {
            store.generateUrl({ res: store.response.data[0], st: store.response.data, pn: store.fixPanel, disable: false })
        }, [store.currentUrlParams]);

        useEffect(() => {
            if (store.update === true) {
                store.getContent(store.selected, true);
            }
        }, [store.update]);

        topic.subscribe("update.point", (status) => {
            const value = {
                ...store.valueRnd,
                x: store.valueRnd.pointClick.x,
                y: store.valueRnd.pointClick.y,
            }
            if (status === true) {
                Object.assign(value, { buttonZoom: {} })
            }
            store.setValueRnd(value);
        });

        const onChangeSelect = useCallback((value) => {
            if (store.checkPointExtent()) {
                const copy = { ...store.response.data.find(x => x.value === value.value) };
                copy.label = copy.permission === "Forbidden" ? forbidden : copy.label;
                store.setSelected(copy);
                store.getContent(copy, false)
                    .then((res) => {
                        store.LinkToGeometry(copy);
                        topic.publish("visible.point", copy);
                        store.setValueRnd({ ...store.valueRnd, buttonZoom: { [Object.keys(store.valueRnd?.buttonZoom)[0]]: true } });

                        if (panel) {
                            store.updateSelectFeatures(panel, store.propsCoords, res)
                        }
                    })
            }
        }, []);

        const reloadLayer = useCallback(async (layerId) => {
            // It is possible to have few webmap layers for one resource id
            const layers = await display.current?.webmapStore.filterLayers({
                query: { layerId },
            });

            layers?.forEach((item) => {
                const layer = display.current?.webmapStore.getLayer(item.id);
                layer?.reload();
            });
        }, [store.selected]);

        const editFeature = useMemo(() => {
            if (store.response?.featureCount > 0 && store.selected && store.selected.type === "vector") {
                const { id, layerId, styleId } = store.selected;
                const item = getEntries(display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.styleId === styleId)?.[1];

                if (display.isTinyMode() && !display.isTinyModePlugin("@nextgisweb/webmap/plugin/feature-layer")) {
                    return false;
                } else if (!store.isEditEnabled(display, item)) {
                    return false;
                } else if (store.selected.permission === "Forbidden") {
                    return false;
                } else {
                    return (
                        <Button
                            title={gettext("Edit")}
                            className="icon-symbol"
                            type="text"
                            size="small"
                            onClick={() => {
                                const featureId = id;
                                const resourceId = layerId;
                                showModal(FeatureEditorModal, {
                                    transitionName: "",
                                    maskTransitionName: "",
                                    editorOptions: {
                                        featureId,
                                        resourceId: resourceId,
                                        showGeometryTab: false,
                                        onSave: () => {
                                            store.setUpdate(true);
                                            topic.publish("feature.updated", { resourceId: layerId, featureId: id });
                                            reloadLayer(layerId)
                                        },
                                    },
                                });

                            }}
                        >
                            <EditNote />
                        </Button>
                    )
                }
            }
        }, [store.selected]);

        const handleDragStop = (e, d) => {
            if (store.valueRnd.x !== d.x || store.valueRnd.y !== d.y) {
                store.setValueRnd({ ...store.valueRnd, x: d.x, y: d.y });
                if (store.valueRnd.width === store.sizeWindow.width && store.valueRnd.height === store.sizeWindow.height) {
                    store.setValueRnd({ ...store.valueRnd, width: store.pos.width, height: store.pos.height, x: store.pos.x, y: store.pos.y - store.offHP });
                    store.setFullscreen(false);
                }
            }
        };

        const filterOption = (input, option?: { label: string; value: string; desc: string }) => {
            if ((option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                (option?.desc ?? "").toLowerCase().includes(input.toLowerCase())) {
                return true
            } else {
                return false
            }
        };

        return createPortal(
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: "#106a90",
                    },
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
                            colorPrimary: "var(--primary)",
                            colorBorder: "transparent",
                            borderRadius: 4,
                            controlHeight: 24,
                            fontSize: 16,
                            lineWidth: 1,
                            lineHeight: 1,
                            paddingXS: 50
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
                            borderRadius: 4,
                        },
                        Tag: {
                            colorFillSecondary: "#00000010",
                            defaultColor: "var(--text-secondary)",
                            colorPrimary: "var(--primary)",
                            colorPrimaryActive: "#00000010",
                            colorPrimaryHover: "#00000010",
                            borderRadiusSM: 2,
                        },
                        Message: {
                            colorSuccess: "var(--primary)",
                        }
                    }
                }}
            >
                <Rnd
                    style={{ zIndex: 10 }}
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
                    cancel=".icon-symbol,.select-feature,.content,.coordinate-value,.link-block"
                    bounds={store.valueRnd?.width === store.sizeWindow.width && store.valueRnd?.height === store.sizeWindow.height ? undefined : "window"}
                    minWidth={store.pos?.width}
                    minHeight={store.pos?.height}
                    allowAnyClick={true}
                    enableResizing={store.response.featureCount > 0 ?
                        (store.fixPos === null ? true : false) :
                        false}
                    disableDragging={store.response.featureCount > 0 && store.fixPos !== null ?
                        true :
                        false}
                    onDragStop={handleDragStop}
                    position={store.response.featureCount > 0 && store.fixPos !== null ?
                        { x: store.fixPos?.x, y: store.fixPos?.y } :
                        { x: store.valueRnd?.x, y: store.valueRnd?.y }}
                    size={store.response.featureCount > 0 && store.fixPos !== null ?
                        { width: store.fixPos?.width, height: store.fixPos?.height } :
                        { width: store.valueRnd?.width, height: store.valueRnd?.height }}
                    onResize={(e, direction, ref, delta, position) => {
                        store.setValueRnd({ ...store.valueRnd, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y });
                    }}
                >
                    <div className="popup">
                        <div className="title">
                            {store.valueRnd.buttonZoom["topLeft"] && (
                                <div style={{ margin: "0 6px 0 0" }}>
                                    <ButtonZoomComponent {...contentProps} />
                                </div>
                            )}
                            <span
                                className="title-name"
                                // size={store.size}
                                // type="text"
                                onClick={(e) => {
                                    if (store.response.featureCount > 0 && e.detail === 2) {
                                        setTimeout(() => {
                                            if (store.valueRnd.width > store.pos.width || store.valueRnd.height > store.pos.height) {
                                                store.setValueRnd({ ...store.valueRnd, width: store.pos.width, height: store.pos.height, x: store.pos.x, y: store.pos.y - store.offHP });
                                                store.setFullscreen(false)
                                            } else {
                                                store.setValueRnd({ ...store.valueRnd, width: store.sizeWindow.width, height: store.sizeWindow.height, x: store.fX, y: store.fY });
                                                store.setFullscreen(true);
                                            }
                                        }, 200)
                                    } else {
                                        e.stopPropagation();
                                    }
                                }}
                                title={store.selected?.desc}
                            >
                                <span className="object-select">Объектов: {store.response.featureCount}</span>
                                {store.response.featureCount > 0 && store.selected && (
                                    <span
                                        className="layer-name">
                                        {store.selected?.desc}
                                    </span>
                                )}
                            </span>
                            {store.response.featureCount > 0 && <CheckOnlyOne {...{ store }} />}
                            {store.response.featureCount > 0 && (
                                <Button
                                    size={store.size}
                                    type="text"
                                    icon={store.fullscreen === true ? (<CloseFullscreen />) : (<OpenInFull />)}
                                    title={store.fullscreen === true ? gettext("Сollapse fullscreen popup") : gettext("Open fullscreen popup")}
                                    className={store.response.featureCount > 0 && store.fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                    onClick={() => {
                                        if (store.response.featureCount > 0 && store.fixPos === null) {
                                            if (store.valueRnd.width > store.pos.width || store.valueRnd.height > store.pos.height) {
                                                store.setValueRnd({ ...store.valueRnd, width: store.pos.width, height: store.pos.height, x: store.pos.x, y: store.pos.y - store.offHP });
                                                store.setFullscreen(false)
                                            }
                                            else {
                                                store.setValueRnd({ ...store.valueRnd, width: store.sizeWindow.width, height: store.sizeWindow.height, x: store.fX, y: store.fY });
                                                store.setFullscreen(true)
                                            }
                                            if (store.valueRnd.width < store.sizeWindow.width && store.valueRnd.width > store.pos.width || store.valueRnd.height < store.sizeWindow.height && store.valueRnd.height > store.pos.height) {
                                                store.setValueRnd({ ...store.valueRnd, width: store.sizeWindow.width, height: store.sizeWindow.height, x: store.fX, y: store.fY });
                                                store.setFullscreen(true)
                                            }
                                        }
                                    }}
                                />
                            )}
                            <Button
                                icon={<CloseIcon />}
                                size={store.size}
                                type="text"
                                title={gettext("Close")}
                                className={store.response.featureCount > 0 && store.fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                onClick={() => {
                                    store.pointDestroy();
                                    if (panel) {
                                        panel.setActiveChecked({
                                            ...panel.activeChecked,
                                            achecked: false,
                                        });
                                    }
                                }} />
                            {store.valueRnd.buttonZoom["topRight"] && (
                                <div style={{ margin: "0 0 0 6px" }}>
                                    <ButtonZoomComponent {...contentProps} />
                                </div>
                            )}
                        </div>
                        {store.response.featureCount > 0 && store.selected && (
                            <div className={store.selected.permission !== "Forbidden" ? "select-feature" : "select-feature-forbidden"} >
                                <Select
                                    labelInValue
                                    optionLabelProp="label"
                                    placement="topLeft"
                                    filterOption={filterOption}
                                    showSearch
                                    size="small"
                                    value={{ label: store.selected.label, value: store.selected.value }}
                                    style={{ width: editFeature ? "calc(100% - 26px)" : "100%", padding: "0px 2px 0px 2px" }}
                                    onChange={onChangeSelect}
                                >
                                    {store.response.data.map((item, index) => {
                                        const alias = item.permission === "Forbidden" ? forbidden : item.label;
                                        return (
                                            <Option key={index} type={item.type} value={item.value} label={alias} desc={item.desc}>
                                                {alias}
                                            </Option>
                                        )
                                    })}
                                </Select>
                                {editFeature}
                            </div>
                        )}
                        {store.response.featureCount > 0 && store.selected && store.selected.permission !== "Forbidden" && (
                            <div className="content">
                                <ContentComponent {...contentProps} />
                            </div>
                        )}
                        {(<div className="footer-popup">
                            {store.valueRnd.buttonZoom["bottomLeft"] && <div style={{ margin: "0 6px 0 0" }}><ButtonZoomComponent {...contentProps} /></div>}
                            <CoordinateComponent {...coordinateProps} />
                            {store.valueRnd.buttonZoom["bottomRight"] && <div style={{ margin: "0 0 0 6px" }}><ButtonZoomComponent {...contentProps} /></div>}
                        </div>)}
                    </div>
                </Rnd >
            </ConfigProvider>,
            document.getElementById("portal-popup")
        )
    }
);