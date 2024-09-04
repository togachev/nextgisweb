import { FC } from "react";
import { Button } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";
import VectorLink from "@nextgisweb/icon/mdi/vector-link";
import UpdateLink from "@nextgisweb/icon/mdi/update";

export const CoordinateComponent: FC = ({ display, contextUrl, count, op }) => {
    const { copyValue, contextHolder } = useCopy();
    const imodule = display.identify_module;
    const lon = imodule.lonlat[0];
    const lat = imodule.lonlat[1];

    const coordsValue = lon + ", " + lat;
    const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

    return (
        <div className="footer-coordinate-component">
            {contextHolder}
            <span className="coordinate-value" title={gettext("Copy coordinates")} onClick={() => { copyValue(coordsValue, gettext("Coordinates copied")) }}>
                <span className="icon-location"><Location /></span>
                <span className="coords">{coordsVisible}</span>
            </span>
            {op === "popup" && contextUrl !== null && (
                <div className="link-block">
                    <Button className="link-button"
                        icon={<UpdateLink />}
                        title={gettext("Update url display map")}
                        onClick={(e) => {
                            if (e.detail === 2) {
                                window.history.pushState({}, "", routeURL("webmap.display", display.config.webmapId))
                            }
                            if (e.detail === 1) {
                                window.history.pushState({}, "", contextUrl)
                            }
                        }}
                    />
                    <Button className="link-button"
                        icon={<VectorLink />}
                        title={count > 0 ? gettext("Copy link to object") : gettext("Copy link to location")}
                        onClick={() => {
                            copyValue(contextUrl, count > 0 ? gettext("Object reference copied") : gettext("Location link copied"))
                        }}
                    />
                </div>
            )}
        </div>
    )
};