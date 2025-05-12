import { useCallback } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";
import VectorLink from "@nextgisweb/icon/mdi/vector-link";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import { observer } from "mobx-react-lite";

import type { CoordinateProps } from "../type";
import { getPermalink } from "@nextgisweb/webmap/utils/permalink";

export const CoordinateComponent = observer((props) => {
    const { store, display, count, op } = props as CoordinateProps
    const { copyValue, contextHolder } = useCopy();
    const imodule = display.imodule;
    const [lon, lat] = imodule.lonlat;

    const coordsValue = lon + ", " + lat;
    const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

    const msgUpdate = [
        gettext("Update web map url."),
        gettext("Double click will return the original page address."),
        gettext("Right click will update the page address without creating a popup."),
    ];

    const msgCopy = [
        count > 0 ? gettext("Copy link to object") : gettext("Copy link to location"),
        gettext("Right click will copy the page address without creating a popup."),
    ];

    const handleClick = useCallback((e) => {
        e.preventDefault();
        switch (e.type) {
            case "click":
                if (e.detail === 2) {
                    window.history.pushState({}, "", routeURL("webmap.display", display.config.webmapId))
                }
                if (e.detail === 1) {
                    window.history.pushState({}, "", store.contextUrl)
                }
                break;
            case "contextmenu":
                display.getVisibleItems().then((visibleItems) => {
                    const permalink = getPermalink({ display, visibleItems });
                    window.history.pushState({}, "", permalink)
                });
                break;
        }
    }, []);

    const handleClickCopy = useCallback((e) => {
        e.preventDefault();
        switch (e.type) {
            case "click":
                copyValue(store.contextUrl, count > 0 ? gettext("Object reference copied") : gettext("Location link copied"));
                break;
            case "contextmenu":
                display.getVisibleItems().then((visibleItems) => {
                    const permalink = getPermalink({ display, visibleItems });
                    copyValue(permalink, count > 0 ? gettext("Object reference copied") : gettext("Location link copied"));
                });
                break;
        }
    }, []);



    return (
        <div className="footer-coordinate-component">
            {contextHolder}
            <span
                className="coordinate-value"
                title={gettext("Copy coordinates")}
                onClick={() => { copyValue(coordsValue, gettext("Coordinates copied")) }}
            >
                <span className="icon-location">
                    <Location />
                </span>
                <span className="coords">{coordsVisible}</span>
            </span>
            {!display.tinyConfig && op === "popup" && store.contextUrl !== null && (
                <div className="link-block">
                    <Button
                        type="text"
                        icon={<UpdateLink />}
                        title={msgUpdate.join("\n")}
                        className="link-button"
                        onClick={handleClick}
                        onContextMenu={handleClick}
                    />
                    <Button
                        type="text"
                        icon={<VectorLink />}
                        title={msgCopy.join("\n")}
                        className="link-button"
                        onClick={handleClickCopy}
                        onContextMenu={handleClickCopy}
                    />
                </div>
            )}
        </div>
    )
});