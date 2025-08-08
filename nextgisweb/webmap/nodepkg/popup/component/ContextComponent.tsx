import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, ConfigProvider } from "@nextgisweb/gui/antd";
import { PopupStore } from "../PopupStore";
import Location from "@nextgisweb/icon/material/my_location";
import { useOutsideClick } from "../util/function";

interface ContextProps {
    store: PopupStore;
}

export const ContextComponent = observer(
    (props: ContextProps) => {
        const { store } = props;
        const { array_context, posContext, pointContextClick } = store;

        const ref = useRef<HTMLDivElement | null>(null);
        useOutsideClick(ref, () => store.setContextHidden(true));

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
                        ref={ref}
                        className="context-position"
                        onClick={() => {
                            store.setContextHidden(true)
                        }}
                        style={{
                            width: posContext.width,
                            height: posContext.height,
                            left: posContext.x,
                            top: posContext.y,
                            position: "absolute",
                            zIndex: 10,
                            display: store.contextHidden ? "none" : "block",
                        }}>
                        {contextHolder}
                        <span className="context-coord">
                            <Button
                                type="text"
                                size="small"
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
                                        alert(item.title);
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
);