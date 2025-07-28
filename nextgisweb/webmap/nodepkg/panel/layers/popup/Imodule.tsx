import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { transform } from "ol/proj";
import { observer } from "mobx-react-lite";
import { Button, ConfigProvider, Space } from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import { Store } from "./Store";
import CloseIcon from "@nextgisweb/icon/material/close";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { isMobile, useMobileOrientation } from "react-device-detect";
import { getPosition, getPositionContext, outsideClick } from "./util/function";
import settings from "@nextgisweb/webmap/client-settings";

import type { Display } from "@nextgisweb/webmap/display";

import "./Imodule.less";

interface ImoduleProps {
    display: Display;
}

const webMercator = "EPSG:3857";
const wgs84 = "EPSG:4326";

export default observer(
    function Imodule({ display }: ImoduleProps) {
        const { isLandscape } = useMobileOrientation();
        const [pos, setPos] = useState({
            x: 0, y: 0, width: settings.popup_size.width,
            height: settings.popup_size.height,
        });
        const [posContext, setPosContext] = useState({ x: 0, y: 0 });

        const portalPopup = useRef(null);
        const portalContext = useRef(null);

        outsideClick(portalContext, () => store.setContextHidden(true));

        const [store] = useState(
            () => new Store({
                display: display,
                sizeWindow: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
                valueRnd: {
                    x: pos.x,
                    y: pos.y,
                    width: pos.width,
                    height: pos.height,
                },
            }));

        const olmap = display.map.olMap;

        const contextMenu = useCallback((e) => {
            if (e.dragging) return;

            olmap.un("singleclick", singleClick);
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

            setTimeout(() => {
                olmap.on("singleclick", singleClick);
            }, 750);
            store.setContextHidden(false);
        }, []);

        const singleClick = useCallback((e) => {
            if (e.dragging) return;

            e.preventDefault();
            getPosition(e.originalEvent.clientX, e.originalEvent.clientY, store)
                .then(val => {
                    setPos(val);
                    store.setValueRnd({ width: val?.width, height: val?.height, x: val?.x, y: val?.y - 40 });
                    store.renderPoint(e);
                    const lonlat = transform(e.coordinate, webMercator, wgs84);
                    store.setPointPopupClick({
                        typeEvents: "singleclick",
                        pixel: e.pixel,
                        clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
                        coordinate: e.coordinate,
                        lonlat: lonlat,
                    });
                    store.overlayInfo(e, "popup", false, lonlat)
                        .then(val => {
                            console.log(val);
                            store.getResponse("popup", false)
                        })
                    store.setContextHidden(true);
                    store.setPopupHidden(false);
                });
        }, [store.pointPopupClick]);
        console.log(store.countFeature, store.response);
        useEffect(() => {
            store.setIsLandscape(isLandscape);
            store.setIsMobile(isMobile);
        }, [isLandscape, isMobile]);

        useEffect(() => {
            if (display.panelManager.getActivePanelName() !== "custom-layer") {
                olmap.on("singleclick", singleClick);
                olmap.on("contextmenu", contextMenu);

                const handleResize = () => {
                    store.setSizeWindow({
                        width: window.innerWidth,
                        height: window.innerHeight,
                    });
                }
                window.addEventListener("resize", handleResize);

                return () => {
                    olmap.un("singleclick", singleClick);
                    olmap.un("contextmenu", contextMenu);
                    window.removeEventListener("resize", handleResize);
                };
            } else {
                store.point_destroy();
            }
        }, [display.panelManager.activePanel]);

        const W = store.sizeWindow.width;

        const handleDragStop = (e, d) => {
            store.setValueRnd({ ...store.valueRnd, x: d.x, y: d.y });
        };

        const lonlatPopup = store.pointPopupClick?.lonlat.map(number => parseFloat(number.toFixed(6)));
        const lonlatContext = store.pointContextClick?.lonlat.map(number => parseFloat(number.toFixed(6)));

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
                {
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
                                bounds={store.valueRnd?.width === W ? undefined : "window"}
                                minWidth={pos?.width}
                                minHeight={pos?.height}
                                allowAnyClick={true}
                                enableResizing={
                                    // countFeature > 0 ? (fixPos === null ? 
                                    true
                                    // : false) : false
                                }
                                disableDragging={
                                    // countFeature > 0 && fixPos !== null ? true :
                                    false
                                }
                                onDragStop={handleDragStop}
                                position={
                                    // countFeature > 0 && fixPos !== null ? { x: fixPos?.x, y: fixPos?.y } : 
                                    { x: store.valueRnd?.x, y: store.valueRnd?.y }}
                                size={
                                    // countFeature > 0 && fixPos !== null ? { width: fixPos?.width, height: fixPos?.height } : 
                                    { width: store.valueRnd?.width, height: store.valueRnd?.height }}
                                onResize={(e, direction, ref, delta, position) => {
                                    store.setValueRnd({ ...store.valueRnd, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y });
                                }}
                            >
                                <div className="popup">
                                    <Space direction="vertical" className="control-button">
                                        <Button
                                            icon={<CloseIcon />}
                                            type="text"
                                            title={gettext("Close")}
                                            size={!isMobile && "small"}
                                            onClick={() => {
                                                store.setPopupHidden(true);
                                                store.setContextHidden(true);
                                                store.point_destroy();
                                            }} />
                                    </Space>
                                    {lonlatPopup}
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