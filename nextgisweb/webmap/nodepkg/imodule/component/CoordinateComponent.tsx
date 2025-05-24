import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";
import VectorLink from "@nextgisweb/icon/mdi/vector-link";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import Fullscreen from "@nextgisweb/icon/mdi/fullscreen";
import { ButtonCheckboxGroup } from "./ButtonCheckboxGroup";

import type { CoordinateProps } from "../type";

export const CoordinateComponent = observer((props) => {
    const { store: storeProp, display, op } = props as CoordinateProps
    const [store] = useState(() => storeProp);

    const { copyValue, contextHolder } = useCopy();
    const imodule = display.imodule;
    const [lon, lat] = imodule.lonlat;

    const coordsValue = lon + ", " + lat;
    const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

    const msgCopy = [
        store.countFeature > 0 ? gettext("Copy link to object") : gettext("Copy link to location"),
        gettext("Right click to copy the current web map coverage."),
    ];

    const handleClickCopy = useCallback((e) => {
        const messageClickCopy = store.countFeature > 0 ? gettext("Object reference copied") : gettext("Location link copied");
        const messageContextMenuCopy = gettext("Current web map coverage copied");

        e.preventDefault();
        switch (e.type) {
            case "click":
                copyValue(store.contextUrl, messageClickCopy);
                break;
            case "contextmenu":
                copyValue(store.permalink, messageContextMenuCopy);
                break;
        }
    }, []);

    const propsButton = {
        items: [
            {
                label: <UpdateLink />, value: "popup", url: store.contextUrl,
                status: store.currentUrlStatus,
                title: gettext("Update current web map address")
            },
            {
                label: <Fullscreen />, value: "extent", url: store.permalink,
                status: store.currentUrlExtentStatus,
                title: gettext("Set current map coverage")
            },
        ],
        store,
        display,
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
            {!display.tinyConfig && op === "popup" && store.contextUrl !== null && (
                <div className="link-block">
                    <ButtonCheckboxGroup {...propsButton} />
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