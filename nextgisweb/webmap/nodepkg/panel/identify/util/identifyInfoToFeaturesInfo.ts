import type { Display } from "@nextgisweb/webmap/display";

import type { FeatureInfo, IdentifyInfo, RasterInfo } from "../identification";

export function identifyInfoToFeaturesInfo(
    identifyInfo: IdentifyInfo,
    display: Display
): (FeatureInfo | RasterInfo)[] {
    if (!identifyInfo) {
        return [];
    }

    const { response, layerLabels } = identifyInfo;
    const layersResponse = Object.keys(response);
    const featuresInfo: (FeatureInfo | RasterInfo)[] = [];

    const items = display.treeStore
        .filter({ type: "layer" })
        .sort((a, b) => b.drawOrderPosition - a.drawOrderPosition);
    items.forEach(({ layerId, styleId }) => {
        const layerIdx = layersResponse.indexOf(styleId.toString());
        
        const layerResponse = response[styleId];
        if (layerIdx === -1) {
            return;
        }
        if ("features" in layerResponse) {
            layerResponse.features.forEach((f, idx) => {
                const id = f.id;
                const value = `${styleId}:${layerId}:${id}`;
                const label = `${f.label} (${layerLabels[styleId]})`;
                featuresInfo.push({
                    id,
                    value,
                    label,
                    layerId,
                    styleId,
                    idx,
                    type: "feature_layer",
                });
            });
        } else if ("color_interpretation" in layerResponse) {
            const label = `${layerLabels[styleId]}`;
            const point = response[styleId].point_select
            featuresInfo.push({
                type: "raster_layer",
                value: `${styleId}:${layerId}:${point[0]}:${point[1]}`,
                label,
                layerId,
                styleId,
            });
        }
        layersResponse.splice(layerIdx, 1);
    });
    
    return featuresInfo;
}
