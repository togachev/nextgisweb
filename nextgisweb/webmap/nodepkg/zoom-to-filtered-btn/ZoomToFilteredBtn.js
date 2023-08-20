import { useEffect, useState } from "react";

import { Button } from "@nextgisweb/gui/antd";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { gettext } from "@nextgisweb/pyramid/i18n";

import ZoomInMap from "@nextgisweb/icon/material/zoom_in_map";

const zoomToFilteredMsg = gettext("Zoom to filtered features");

export const ZoomToFilteredBtn = ({
    id,
    query,
    size = "middle",
    onZoomToFiltered,
}) => {
    const {
        data: extentData,
        refresh: refreshExtent,
        isLoading: loading,
    } = useRouteGet(
        "feature_layer.feature.extent",
        { id },
        { query: { ilike: query } }
    );

    const [extentCache, setExtentCache] = useState();

    const click = () => {
        if (!onZoomToFiltered) {
            return;
        }

        if (extentCache && extentCache[query]) {
            onZoomToFiltered(extentCache[query]);
            return;
        }

        setExtentCache({});
        refreshExtent();
    };

    useEffect(() => {
        if (!onZoomToFiltered || !extentData || !extentCache) {
            return;
        }

        const { extent } = extentData;
        extentCache[query] = extent;
        onZoomToFiltered(extent);
    }, [extentData]);

    return (
        <Button
            type="text"
            title={zoomToFilteredMsg}
            icon={<ZoomInMap />}
            onClick={click}
            size={size}
            loading={loading}
        />
    );
};
