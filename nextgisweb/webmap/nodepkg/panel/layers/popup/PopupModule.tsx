import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { transform } from "ol/proj";
import { observer } from "mobx-react-lite";
import { Button, ConfigProvider, Select } from "@nextgisweb/gui/antd";
import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";
import { Rnd } from "react-rnd";
import { PopupStore } from "./PopupStore";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { isMobile as isM, useMobileOrientation } from "react-device-detect";
import { getPosition, getPositionContext, useOutsideClick } from "./util/function";
import { ButtonZoomComponent } from "./component/ButtonZoomComponent";
import { ContentComponent } from "./component/ContentComponent";
import { CoordinateComponent } from "./component/CoordinateComponent";
import Pin from "@nextgisweb/icon/mdi/pin";
import PinOff from "@nextgisweb/icon/mdi/pin-off";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import FitToScreenOutline from "@nextgisweb/icon/mdi/fit-to-screen-outline";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import topic from "@nextgisweb/webmap/compat/topic";
import { getEntries } from "./util/function";

import type SelectedFeatureStore from "@nextgisweb/webmap/panel/selected-feature/SelectedFeatureStore";
import type { Display } from "@nextgisweb/webmap/display";
import type { SizeType } from "@nextgisweb/gui/antd";

import "./PopupModule.less";

interface PopupModuleProps {
    display: Display;
}

const webMercator = "EPSG:3857";
const wgs84 = "EPSG:4326";
const { Option } = Select;
const forbidden = gettext("The data is not available for reading");

const CheckOnlyOne = ({ store, size }) => {
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
        size: size,
        color: store.fixPopup && "primary",
        title: store.fixPopup ? msgFixOffPopup : msgFixPopup,
        className: !store.fixPopup ? "icon-symbol" : "icon-checked",
    }

    return (<Button {...props} />);
};


export default observer(
    function PopupModule({ display }: PopupModuleProps) {
        const { isLandscape: isL, isPortrait: isP } = useMobileOrientation();
        const [pos, setPos] = useState({ x: -9999, y: -9999, width: 0, height: 0 });
        const [posContext, setPosContext] = useState({ x: -9999, y: -9999, width: 0, height: 0 });

        const [size, setSize] = useState<SizeType>("default");

        const pm = display.panelManager;
        const pkey = "selected-feature";
        const panel = pm.getPanel<SelectedFeatureStore>(pkey);

        const urlParams = display.getUrlParams();
        const opts = display.config.options;
        const attrs = opts["webmap.identification_attributes"];
        const geoms = opts["webmap.identification_geometry"];

        const portalPopup = useRef(document.createElement("div"));
        const portalContext = useRef(document.createElement("div"));

        useOutsideClick(portalContext, () => store.setContextHidden(true));

        const [store] = useState(
            () => new PopupStore({
                display: display,
                sizeWindow: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                isLandscape: isL,
                isPortrait: isP,
                isMobile: isM,
                fixPos: null,
                fixPanel: urlParams.pn ? urlParams.pn :
                    attrs === true ? "attributes" :
                        attrs === false && geoms === true ? "geom_info" :
                            (attrs === false && geoms === false) && "description",
                control: {
                    reset: {
                        icon: <LockReset />,
                        title: gettext("Reset url"),
                        disabled: true,
                    },
                    popup: {
                        icon: <UpdateLink />,
                        url: "",
                        title: gettext("Update current web map address"),
                        status: false,
                        checked: false,
                    },
                    fixedscreen: {
                        icon: <FitToScreenOutline />,
                        url: "",
                        title: gettext("Set current map coverage"),
                        status: false,
                        checked: false,
                    }
                },
            }));

        const olmap = display.map.olMap;

        const typeClick = isM ? "singleclick" : "click";

        const contextMenu = useCallback((e) => {
            if (e.dragging) return;

            isM && olmap.un("singleclick", click);
            e.preventDefault();
            getPositionContext(e.originalEvent.clientX, e.originalEvent.clientY, store)
                .then(val => {
                    setPosContext(val);
                })
            const lonlat = transform(e.coordinate, webMercator, wgs84);
            store.setPointContextClick({
                typeEvents: "contextmenu",
                pixel: e.pixel,
                clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
                coordinate: e.coordinate,
                lonlat: lonlat,
            });

            isM && setTimeout(() => {
                olmap.on("singleclick", click);
            }, 250);
            store.setContextHidden(false);
        }, []);

        const click = useCallback((e) => {
            if (e.dragging) return;
            store.setMode("click");
            e.preventDefault();
            store.overlayInfo(e, "popup", false)
                .then(props => {
                    store.setParams(props);
                    return store.getResponse(props)
                })
                .then(item => {
                    store.setResponse({ data: item.data, featureCount: item.featureCount });
                    store.setSelected(item.data[0]);
                })
                .then(() => {
                    console.log(e.originalEvent.clientX, e.originalEvent.clientY, e);

                    getPosition(display, e.originalEvent.clientX, e.originalEvent.clientY, store)
                        .then(val => {
                            setPos(val);
                            store.setValueRnd({
                                ...store.valueRnd, width: val?.width, height: val?.height, x: val?.x, y: val?.y - 40,
                                pointClick: val?.pointClick,
                                buttonZoom: val?.buttonZoom,
                            });
                            store.contentGenerate();
                        })
                    store.renderPoint(e);
                    const lonlat = transform(e.coordinate, webMercator, wgs84);
                    console.log(e);

                    store.setPointPopupClick({
                        typeEvents: "click",
                        pixel: e.pixel,
                        clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
                        coordinate: e.coordinate,
                        lonlat: lonlat,
                    });
                });
            store.setContextHidden(true);
            store.setPopupHidden(false);
        }, [store.pointPopupClick]);

        useEffect(() => {
            store.setIsLandscape(isL);
            store.setIsPortrait(isP);
            store.setIsMobile(isM);
            isM ? setSize("default") : setSize("small");
        }, [isL, isP, isM]);

        useEffect(() => {
            if (display.panelManager.getActivePanelName() !== "custom-layer") {
                olmap.on(typeClick, click);
                olmap.on("contextmenu", contextMenu);

                const handleResize = () => {
                    store.setSizeWindow({
                        width: window.innerWidth,
                        height: window.innerHeight,
                    });
                }
                window.addEventListener("resize", handleResize);

                return () => {
                    olmap.un(typeClick, click);
                    olmap.un("contextmenu", contextMenu);
                    window.removeEventListener("resize", handleResize);
                };
            } else {
                store.pointDestroy();
            }
        }, [display.panelManager.activePanel]);

        useEffect(() => {
            if (store.fixPopup) {
                store.setFixPos(store.valueRnd);
                // store.setFixPanel(store.fixContentItem.key)
            } else {
                store.setFixPos(null);
            }
        }, [store.fixPopup]);

        const handleDragStop = (e, d) => {
            store.setValueRnd({ ...store.valueRnd, x: d.x, y: d.y });
        };

        const lonlatPopup = store.pointPopupClick?.lonlat.map(number => parseFloat(number.toFixed(6)));
        const lonlatContext = store.pointContextClick?.lonlat.map(number => parseFloat(number.toFixed(6)));
        const contentProps = { store: store, display: display };
        const coordinateProps = { display: display, store: store, op: "popup", point: false };

        const onChangeSelect = async (value) => {
            const selectedValue = store.response.data.find(item => item.value === value.value);
            const copy = { ...selectedValue };
            copy.label = copy.permission === "Forbidden" ? forbidden : copy.label;
            store.setSelected(copy);
            store.getContent(copy, false);
            store.LinkToGeometry(copy);
            topic.publish("visible.point", copy);
            store.setValueRnd({ ...store.valueRnd, buttonZoom: { [Object.keys(store.valueRnd?.buttonZoom)[0]]: true } });

            // const selectedProps = { ...selectedValue };
            // Object.assign(selectedProps, propsCoords());
            // if (panel) {
            //     updateSelectFeatures(panel, selectedProps)
            // }
        };

        const filterOption = (input, option?: { label: string; value: string; desc: string }) => {
            if ((option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                (option?.desc ?? "").toLowerCase().includes(input.toLowerCase())) {
                return true
            } else {
                return false
            }
        };

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
                                        onSave: () => {
                                            store.setUpdate(true);
                                            topic.publish("feature.updated", { resourceId: layerId, featureId: id });
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

        return (
            <>
                {createPortal(
                    <div
                        ref={portalContext}
                        style={{
                            position: "absolute",
                            left: posContext.x,
                            top: posContext.y,
                            backgroundColor: "#eee",
                            width: posContext.width,
                            height: posContext.height,
                            zIndex: 11,
                            display: store.contextHidden ? "none" : "block",
                        }}
                    >
                        {lonlatContext}
                    </div>,
                    document.getElementById("portal-context")
                )}
                {store.valueRnd &&
                    createPortal(
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
                                ref={portalPopup}
                                style={{ zIndex: 10, display: store.popupHidden ? "none" : "block", }}
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
                                cancel=".control-button"
                                bounds={store.valueRnd?.width === store.wp ? undefined : "window"}
                                minWidth={pos?.width}
                                minHeight={pos?.height}
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
                                        {store.valueRnd.buttonZoom["topLeft"] && <div style={{ margin: "0 6px 0 0" }}><ButtonZoomComponent {...contentProps} /></div>}
                                        <Button
                                            className="title-name"
                                            size={size}
                                            type="text"
                                            onClick={(e) => {
                                                if (store.response.featureCount > 0 && e.detail === 2) {
                                                    setTimeout(() => {
                                                        if (store.valueRnd.width > pos.width || store.valueRnd.height > pos.height) {
                                                            store.setValueRnd({ ...store.valueRnd, width: pos.width, height: pos.height, x: pos.x, y: pos.y });
                                                            store.setFullscreen(false)
                                                        } else {
                                                            store.setValueRnd({ ...store.valueRnd, width: store.wp, height: store.hp, x: store.fX, y: store.fY });
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
                                        </Button>
                                        {store.response.featureCount > 0 && <CheckOnlyOne {...{ store, size }} />}
                                        {store.response.featureCount > 0 && (
                                            <Button
                                                size={size}
                                                type="text"
                                                icon={store.fullscreen === true ? (<CloseFullscreen />) : (<OpenInFull />)}
                                                title={store.fullscreen === true ? gettext("Сollapse fullscreen popup") : gettext("Open fullscreen popup")}
                                                className={store.response.featureCount > 0 && store.fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                                onClick={() => {
                                                    if (store.response.featureCount > 0 && store.fixPos === null) {
                                                        if (store.valueRnd.width > pos.width || store.valueRnd.height > pos.height) {
                                                            store.setValueRnd({ ...store.valueRnd, width: pos.width, height: pos.height, x: pos.x, y: pos.y });
                                                            store.setFullscreen(false)
                                                        } else {
                                                            store.setValueRnd({ ...store.valueRnd, width: store.wp, height: store.hp, x: store.fX, y: store.fY });
                                                            store.setFullscreen(true)
                                                        }
                                                        if (store.valueRnd.width < store.wp && store.valueRnd.width > pos.width || store.valueRnd.height < store.hp && store.valueRnd.height > pos.height) {
                                                            store.setValueRnd({ ...store.valueRnd, width: store.wp, height: store.hp, x: store.fX, y: store.fY });
                                                            store.setFullscreen(true)
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                        <Button
                                            icon={<CloseIcon />}
                                            title={gettext("Close")}
                                            className={store.response.featureCount > 0 && store.fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                            onClick={() => {
                                                store.pointDestroy();
                                                panel && panel.setActiveChecked({
                                                    ...panel.activeChecked,
                                                    achecked: false,
                                                });
                                            }} />
                                        {store.valueRnd.buttonZoom["topRight"] && <div style={{ margin: "0 0 0 6px" }}><ButtonZoomComponent {...contentProps} /></div>}
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
            </>
        )
    }
);