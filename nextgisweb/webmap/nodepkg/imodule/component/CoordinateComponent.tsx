import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import type { BaseButtonProps } from "@nextgisweb/gui/antd";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";
import VectorLink from "@nextgisweb/icon/mdi/vector-link";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import Fullscreen from "@nextgisweb/icon/mdi/fullscreen";
import ContentCopy from "@nextgisweb/icon/mdi/content-copy";

import { getPermalink } from "@nextgisweb/webmap/utils/permalink";
import { ButtonCheckboxGroup } from "./ButtonCheckboxGroup";
import { useComponent } from "../useSource";

import type { CoordinateProps } from "../type";

export const CoordinateComponent = observer((props) => {
    const { store: storeProp, display, op } = props as CoordinateProps
    const [store] = useState(() => storeProp);
    const { status, setStatus, valueCheckbox } = useComponent(display);

    const { copyValue, contextHolder } = useCopy();
    const imodule = display.imodule;
    const [lon, lat] = imodule.lonlat;

    const coordsValue = lon + ", " + lat;
    const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

    const msgUpdate = [
        gettext("Update web map url."),
        gettext("Double click will return the original page address."),
        gettext("Right click to update the address with the current web map coverage."),
    ];

    const msgCopy = [
        store.countFeature > 0 ? gettext("Copy link to object") : gettext("Copy link to location"),
        gettext("Right click to copy the current web map coverage."),
    ];

    const handleClick = useCallback((e) => {
        e.preventDefault();
        switch (e.type) {
            case "click":
                if (e.detail === 2) {
                    window.history.pushState({}, "", routeURL("webmap.display", display.config.webmapId));
                } else if (e.detail === 1) {
                    window.history.pushState({}, "", store.contextUrl);
                }
                break;
            case "contextmenu":
                display.getVisibleItems().then((visibleItems) => {
                    const permalink = getPermalink({ display, visibleItems });
                    window.history.pushState({}, "", decodeURIComponent(permalink));
                });
                break;
        }
    }, []);

    const handleClickCopy = useCallback((e) => {
        const messageClickCopy = store.countFeature > 0 ? gettext("Object reference copied") : gettext("Location link copied");
        const messageContextMenuCopy = gettext("Current web map coverage copied");

        e.preventDefault();
        switch (e.type) {
            case "click":
                copyValue(store.contextUrl, messageClickCopy);
                break;
            case "contextmenu":
                display.getVisibleItems().then((visibleItems) => {
                    const permalink = getPermalink({ display, visibleItems });
                    copyValue(decodeURIComponent(permalink), messageContextMenuCopy);
                });
                break;
        }
    }, []);

    const propsButton = {
        icons: [
            // { label: <LockReset />, value: "reset", disabled: false },
            { label: <UpdateLink />, value: "popup", disabled: false },
            { label: <Fullscreen />, value: "extent", disabled: false },
        ],
        store: store
    }

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
            {!display.tinyConfig && op === "popup" && store.countFeature ===0 && store.contextUrl !== null && (
                <div className="link-block">
                    <ButtonCheckboxGroup {...propsButton} />
                    {/* <ButtonUpdateUrl {...updateUrl("reset")} /> */}
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