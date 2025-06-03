import { debounce } from "lodash-es";
import { useCallback, useEffect, useState } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import type { CoordinateProps } from "../type";

export const CoordinateComponent = observer((props) => {
    const { store: storeProp, display, op, ButtonZoomComponent } = props as CoordinateProps
    const [store] = useState(() => storeProp);

    const { copyValue, contextHolder } = useCopy();
    const imodule = display.imodule;
    const [lon, lat] = imodule.lonlat;

    const coordsValue = lon + ", " + lat;
    const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

    useEffect(() => {
        let isMounted = true;

        const updateTexts = debounce(() => {
            display.mapExtentDeferred.then(() => {
                if (!isMounted) return;
                store.updatePermalink();
            });
        });

        const mapView = display.map.olMap.getView();
        mapView.on("change", updateTexts);
        const listener = display.itemStore.on("Set", updateTexts);

        updateTexts();

        return () => {
            isMounted = false;
            mapView.un("change", updateTexts);
            listener.remove();
        };
    }, [
        display.mapExtentDeferred,
        display.itemStore,
        display.map.baseLayer,
        display.map.olMap,
        display.panelManager.getActivePanelName()
    ]);

    const msgCopyActiveContext = {
        popup: store.countFeature > 0 ? gettext("Object reference copied") : gettext("Location link copied"),
        fixedscreen: gettext("Current web map coverage copied"),
    }

    const msgCopyActive = (value) => {
        return msgCopyActiveContext[value]
    }

    useEffect(() => {
        const updateUrl = store.activeControlKey && store.control[store.activeControlKey].checked;
        switch (store.activeControlKey && store.control[store.activeControlKey].status) {
            case true:
                updateUrl && (
                    window.history.pushState({}, "", store.control[store.activeControlKey].url), // link update
                    copyValue(store.control[store.activeControlKey].url, msgCopyActive(store.activeControlKey)) // link copying
                );
                break;
            case false:
                updateUrl && (
                    window.history.pushState({}, "", ngwConfig.applicationUrl + routeURL("webmap.display", display.config.webmapId)) // reset link to original value
                );
                break;
        }
    }, [store.control]);

    useEffect(() => {
        const values = { ...store.control }
        Object.keys(values).forEach((key) => {
            if (key === "popup") {
                values[key].url = store.contextUrl;
                values[key].checked = store.mode === "simulate" && store.contextUrl ? true : false;
                values["reset"].disabled = !window.location.href.includes("lon=") ? true : false;
            } else if (key === "fixedscreen") {
                values[key].url = store.permalink;
                values[key].checked = false;
            }
        })
        store.setControl(values);
    }, [store.permalink, store.contextUrl]);

    const onClick = useCallback((e, name) => {
        e.preventDefault();
        store.setActiveControlKey(name);
        store.setMode("click");
        const values = { ...store.control }

        if (name === "reset") {
            ["popup", "fixedscreen"].map((key) => {
                values[key].status = false;
                values[key].checked = false;
                values["reset"].disabled = true;
            })
            store.setControl(values);
            window.history.pushState({}, "", ngwConfig.applicationUrl + routeURL("webmap.display", display.config.webmapId));

        } else {
            Object.keys(values).forEach((key) => {
                values["reset"].disabled = false;
                if (key === name) {
                    values[key].status = true;
                    values[key].checked = true;
                } else {
                    values[key].status = false;
                    values[key].checked = false;
                }
            })
            store.setControl(values);
        }
    }, []);

    const propsUpdate = (name, value) => {
        return {
            icon: value.icon,
            onTouchEnd: (e) => onClick(e, name),
            onClick: (e) => onClick(e, name),
            color: value.checked && "primary",
            variant: "outlined",
            type: "text",
            size: "small",
            title: value.title,
            disabled: value.disabled && store.mode !== "simulate",
        }
    }

    return (
        <div className="footer-coordinate-component">
            {contextHolder}
            {store.buttonZoom["bottomLeft"] && <ButtonZoomComponent />}
            <div className="coordinate-and-controls">
                <Button
                    type="text"
                    icon={<Location />}
                    className="coordinate-value"
                    title={gettext("Copy coordinates")}
                    onClick={() => { copyValue(coordsValue, gettext("Coordinates copied")) }}
                >
                    {coordsVisible}
                </Button>
                {!display.tinyConfig && op === "popup" && store.contextUrl !== null && (
                    <div className="link-block">
                        {
                            store.control &&
                            getEntries(store.control).map(([name, value], index) => {
                                return (
                                    <div key={index}>
                                        <Button
                                            {...propsUpdate(name, value)}
                                        />
                                    </div>
                                )
                            })
                        }
                    </div>
                )}
            </div>
            {store.buttonZoom["bottomRight"] && <ButtonZoomComponent />}
        </div>
    )
});