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

    const items = display.treeStore.filter({ type: "layer" });
    items.forEach(({ layerId, styleId }) => {
        const layerIdx = layersResponse.indexOf(styleId.toString());
        
        const layerResponse = response[styleId];
        if (layerIdx === -1) {
            return;
        }
        if ("features" in layerResponse) {
            layerResponse.features.forEach((f, idx) => {
                const id = f.id;
                const value = `${layerId}-${styleId}-${id}`;
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
            featuresInfo.push({
                type: "raster_layer",
                value: `R-${styleId}`,
                label,
                layerId,
                styleId,
            });
        }
        layersResponse.splice(layerIdx, 1);
    });

    return featuresInfo;
}
