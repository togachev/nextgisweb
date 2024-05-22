import { FC } from "react";
import { Button } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";
import LinkIcon from "@nextgisweb/icon/mdi/link";

export const CoordinateComponent: FC = ({ display, link, count, op }) => {
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
                <span className="icon-symbol"><Location /></span>
                <span className="coords">{coordsVisible}</span>
            </span>
            {op === "popup" && (
                <Button
                    size="small"
                    type="link"
                    title={gettext("Object link")}
                    className="copy-to-clipboard"
                    icon={<LinkIcon />}
                    onClick={() => {
                        copyValue(link, count > 0 ? gettext("Object reference copied") : gettext("Location link copied"))
                    }}
                />
            )}
        </div>
    )
};