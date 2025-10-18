import { Spin } from "@nextgisweb/gui/antd";
import { useEffect, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api/route";

import { GeometryInfoPreview } from "./component/GeometryInfoPreview";
import { GeometryInfoTable } from "./component/GeometryInfoTable";

import "./GeometryInfo.less";

interface GeometryInfoProps {
    showPreview?: boolean;
    resourceId: number;
    featureId: number;
    showInfo?: boolean;
    srid?: number;
}

export function GeometryInfo({
    showPreview,
    resourceId,
    featureId,
    showInfo,
    srid = 4326,
}: GeometryInfoProps) {
    const [geometryInfo, setGeometryInfo] = useState()

    useEffect(() => {
        let active = true
        loadGeometryInfo()
        return () => { active = false }

        async function loadGeometryInfo() {
            setGeometryInfo(undefined)
            const value = await route("feature_layer.feature.geometry_info", {
                id: resourceId,
                fid: featureId,
            }).get({ query: { srs: srid }, cache: true });
            if (!active) { return }
            setGeometryInfo(value)
        }
    }, [resourceId, featureId])

    if (!geometryInfo) {
        return (
            <div className="ngw-feature-layer-geometry-info-loading">
                <Spin />
                <div>{gettext("Load geometry info...")}</div>
            </div>
        );
    }

    if (!geometryInfo) {
        return (
            <div className="ngw-feature-layer-geometry-info-error">
                <div>
                    {gettext("Failed to get information about the geometry")}
                </div>
            </div>
        );
    }

    return (
        <>
            {geometryInfo && showPreview && (
                <GeometryInfoPreview
                    geometryInfo={geometryInfo}
                    resourceId={resourceId}
                    featureId={featureId}
                    srid={srid}
                />
            )}
            {showInfo && <GeometryInfoTable geometryInfo={geometryInfo} />}
        </>
    );
}
