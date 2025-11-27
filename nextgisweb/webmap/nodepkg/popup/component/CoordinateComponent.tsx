import { debounce } from "lodash-es";
import { useCallback, useEffect, useState } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";
import { getEntries } from "../util/function";
import type { CoordinateProps } from "../type";

export const CoordinateComponent = observer((props) => {
    const { store: storeProp, display, point } = props as CoordinateProps
    const [store] = useState(() => storeProp);

    const { copyValue, contextHolder } = useCopy();

    const [lon, lat] = store.pointPopupClick.lonlat;

    const coordsValue = lon + ", " + lat;
    const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

    useEffect(() => {
        let isMounted = true;

        const updateTexts = debounce(() => {
            if (!isMounted || !display.map.started) return;
            store.updatePermalink();
        });

        const mapView = display.map.olMap.getView();
        mapView.on("change", updateTexts);

        updateTexts();

        return () => {
            isMounted = false;
            mapView.un("change", updateTexts);
        };
    }, [
        display.mapExtentDeferred,
        display.itemStore,
        display.map.baseLayer,
        display.map.olMap,
        display.panelManager.getActivePanelName()
    ]);

    const msgCopyActiveContext = {
        popup: store.response.featureCount > 0 ? gettext("Object reference copied") : gettext("Location link copied"),
        fixedscreen: gettext("Current web map coverage copied"),
    }

    const msgCopyActive = (value) => {
        return msgCopyActiveContext[value]
    }

    useEffect(() => {
        const updateUrl = store.activeControlKey && store.controls[store.activeControlKey].checked;
        switch (store.activeControlKey && store.controls[store.activeControlKey].status) {
            case true:
                if (updateUrl) {
                    window.history.pushState({}, "", store.controls[store.activeControlKey].url); // link update
                    copyValue(store.controls[store.activeControlKey].url, msgCopyActive(store.activeControlKey)) // link copying
                };
                break;
            case false:
                if (updateUrl) {
                    window.history.pushState({}, "", ngwConfig.applicationUrl + routeURL("webmap.display", display.config.webmapId)); // reset link to original value
                };
                break;
        }
    }, [store.controls]);

    useEffect(() => {
        const values = { ...store.controls }
        Object.keys(values).forEach((key) => {
            if (key === "popup") {
                values[key].url = store.contextUrl;
                values[key].checked = store.mode === "simulate" && store.contextUrl ? true : false;
                values["reset"].disable = !window.location.href.includes("lon=") ? true : false;
            } else if (key === "fixedscreen") {
                values[key].url = store.permalink;
                values[key].checked = false;
            }
        })
        store.setControls(values);
    }, [store.permalink, store.contextUrl]);

    const onClick = useCallback((e, name) => {
        e.preventDefault();
        store.setActiveControlKey(name);
        store.setMode("click");
        const values = { ...store.controls }

        if (name === "reset") {
            ["popup", "fixedscreen"].map((key) => {
                values[key].status = false;
                values[key].checked = false;
                values["reset"].disable = true;
            })
            store.setControls(values);
            window.history.pushState({}, "", ngwConfig.applicationUrl + routeURL("webmap.display", display.config.webmapId));

        } else {
            Object.keys(values).forEach((key) => {
                values["reset"].disable = false;
                if (key === name) {
                    values[key].status = true;
                    values[key].checked = true;
                } else {
                    values[key].status = false;
                    values[key].checked = false;
                }
            })
            store.setControls(values);
        }
    }, []);

    const propsUpdate = (name, value) => {
        return {
            icon: value.icon,
            onTouchEnd: (e) => onClick(e, name),
            onClick: (e) => onClick(e, name),
            color: value.checked && "primary",
            variant: "filled",
            type: "text",
            size: "small",
            title: value.title,
            disabled: value.disable && point === false && true,
        }
    };

    return (
        <div className="footer-coordinate-component">
            {contextHolder}
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
                {!display.tinyConfig && store.contextUrl !== null && (
                    <div className="link-block">
                        {
                            store.controls &&
                            getEntries(store.controls).map(([name, value], index) => {
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
        </div>
    )
});