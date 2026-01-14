import { Button, Select, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import OlGeomPoint from "ol/geom/Point";

import type { FeatureSelectorProps, IdentifyInfoItem } from "../identification";

import ZoomInMapIcon from "@nextgisweb/icon/material/zoom_in_map/outline";

export function FeatureSelector({
    display,
    featureInfo,
    featureItem,
    featuresInfoList,
    identifyInfo,
    onFeatureChange,
}: FeatureSelectorProps) {
    if (!featureInfo) {
        return null;
    }

    const item = featureInfo && display.treeStore.filter({ type: "layer", layerId: featureInfo.layerId });
    const highlights = item && item?.length > 0 && item[0].layerHighligh
    
    const zoomTo = () => {
        if (!featureItem) return;
        display.highlighter
            .highlightById(featureItem.id, featureInfo.layerId, display.config.colorSF)
            .then(({ geom }) => {
                display.map.zoomToGeom(geom);
            });
    };

    const zoomToPoint = () => {
        const point = new OlGeomPoint(identifyInfo.point);
        display.map.zoomToExtent(point.getExtent());
    };
    
    const onSelectChange = (
        _value: string,
        featureInfoSelected: IdentifyInfoItem | IdentifyInfoItem[] | undefined
    ) => {
        const selected = Array.isArray(featureInfoSelected)
            ? featureInfoSelected[0]
            : featureInfoSelected;
        onFeatureChange(selected);
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                padding: "8px",
                gap: "4px",
            }}
        >
            <Select
                onChange={onSelectChange}
                style={{ flex: "1 1 auto", minWidth: 0 }}
                value={featureInfo.value}
                options={featuresInfoList}
            />
            {featureInfo.type === "feature_layer" ? (
                <Tooltip title={gettext("Zoom to feature")}>
                    <Button
                        type="link"
                        size="small"
                        disabled={!highlights}
                        onClick={zoomTo}
                        icon={<ZoomInMapIcon />}
                        style={{ flex: "0 0 auto" }}
                    />
                </Tooltip>
            ) : (
                <Tooltip title={gettext("Zoom to pixel raster")}>
                    <Button
                        type="link"
                        size="small"
                        disabled={!highlights}
                        onClick={zoomToPoint}
                        icon={<ZoomInMapIcon />}
                        style={{ flex: "0 0 auto" }}
                    />
                </Tooltip>
            )}
        </div>
    );
}
