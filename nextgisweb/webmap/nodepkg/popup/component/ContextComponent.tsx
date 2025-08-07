import { observer } from "mobx-react-lite";
import { forwardRef, useRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, ConfigProvider } from "@nextgisweb/gui/antd";
import { PopupStore } from "../PopupStore";
import Location from "@nextgisweb/icon/material/my_location";

interface ContextProps {
    store: PopupStore;
}

export default observer(
    forwardRef<HTMLDivElement, ContextProps>(
        function ContextComponent(props, ref) {
            const { mode, array_context, posContext, setContextHidden, pointContextClick } = props.store;

            const innerRef = useRef<HTMLDivElement>(null);
            useImperativeHandle(ref, () => innerRef.current!, [mode]);

            
            const { copyValue, contextHolder } = useCopy();

            const [lon, lat] = pointContextClick.lonlat;

            const coordsValue = lon + ", " + lat;
            const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

            return (
                createPortal(
                    <ConfigProvider
                        theme={{
                            token: {
                                colorPrimary: "#106a90",
                            },
                            components: {
                                Message: {
                                    colorSuccess: "var(--primary)",
                                }
                            }
                        }}>
                        <div
                            ref={innerRef}
                            className="context-position" style={{
                                width: posContext.width,
                                height: posContext.height,
                                left: posContext.x,
                                top: posContext.y,
                                position: "absolute",
                                zIndex: 11,
                                overflow: "hidden",
                            }}>
                            {contextHolder}
                            <span
                                className="context-coord"
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                <Button
                                    type="text"
                                    icon={<Location />}
                                    className="coordinate-value"
                                    title={gettext("Copy coordinates")}
                                    onClick={() => { copyValue(coordsValue, gettext("Coordinates copied")) }}
                                >
                                    {coordsVisible}
                                </Button>
                            </span>
                            {array_context?.map(item => {
                                if (item.visible) {
                                    return (
                                        <div className="context-item" key={item.key} onClick={() => {
                                            console.log("test context menu");

                                        }} >
                                            <span>{item.title}</span>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    </ConfigProvider>,
                    document.getElementById("portal-context")
                )
            )
        }
    )
);