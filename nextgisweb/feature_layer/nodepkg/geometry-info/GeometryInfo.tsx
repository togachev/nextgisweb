
import { useRouteGet } from "@nextgisweb/pyramid/hook";
import type { GeometryInfo } from "../type/GeometryInfo";
import { GeometryInfoPreview } from "./component/GeometryInfoPreview";
import { GeometryInfoTable } from "./component/GeometryInfoTable";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";

import "./GeometryInfo.less";

interface GeometryInfoProps {
    resourceId: number;
    featureId: number;
    showPreview?: boolean;
    srid?: number;
}

export function GeometryInfo({
    showPreview,
    resourceId,
    featureId,
    srid = 4326,
}: GeometryInfoProps) {
    const {
        data: geometryInfo,
        isLoading,
        error,
    } = useRouteGet<GeometryInfo>({
        name: "feature_layer.feature.geometry_info",
        params: {
            id: resourceId,
            fid: featureId,
        },
        options: {
            query: {
                srs: srid,
            },
        },
    });
    
    return (
        <>
            <GeometryInfoTable geometryInfo={geometryInfo} isLoading={isLoading} error={error} resourceId={resourceId} featureId={featureId} />
            {! webmapSettings.identify_module && geometryInfo && showPreview && (
                <GeometryInfoPreview
                    geometryInfo={geometryInfo}
                    resourceId={resourceId}
                    featureId={featureId}
                    srid={srid}
                />
            )}
        </>
    );
}
