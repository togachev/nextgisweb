import { FC } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import Location from "@nextgisweb/icon/material/my_location";

export const CoordinateComponent: FC = ({ coordValue }) => {
    const { copyValue, contextHolder } = useCopy();
    return (
        <span className="coordinate-value" title={gettext("Copy coordinates")} onClick={() => { copyValue(coordValue, gettext("Coordinates copied")) }}>
            {contextHolder}
            <span className="icon-symbol"><Location /></span>
            <span className="coords">{coordValue}</span>
        </span>
    )
};