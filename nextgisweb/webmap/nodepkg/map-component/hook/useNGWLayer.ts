import { MVT } from "ol/format";
import GeoJSON from "ol/format/GeoJSON";
import Tile from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import WebGLTileLayer from "ol/layer/WebGLTile";
import GeoTIFF from "ol/source/GeoTIFF";
import VectorSource from "ol/source/Vector";
import VectorTileSource from "ol/source/VectorTile";
import XYZ from "ol/source/XYZ";
import type { StyleLike } from "ol/style/Style";
import { useMemo } from "react";

import { routeURL } from "@nextgisweb/pyramid/api";

export type LayerType = "geojson" | "geotiff" | "XYZ" | "MVT";

export interface LayerOptions {
    style?: StyleLike;
}

const createGeoJsonLayer = (
    resourceId: number,
    layerOptions?: LayerOptions
) => {
    const url = routeURL("feature_layer.geojson", resourceId);
    const layer = new VectorLayer({
        source: new VectorSource({ url: url, format: new GeoJSON() }),
        ...layerOptions,
    });
    return layer;
};

const createGeoTIFFLayer = (resourceId: number) => {
    const url = routeURL("raster_layer.cog", resourceId);
    const layer = new WebGLTileLayer({
        source: new GeoTIFF({ sources: [{ url: url }] }),
    });
    return layer;
};

const createXYZLayer = (resourceId: number) => {
    const url =
        routeURL("render.tile") +
        `?resource=${resourceId}&x={x}&y={y}&z={z}&nd=204`;
    const layer = new Tile({
        source: new XYZ({ wrapX: false, url: url }),
    });
    return layer;
};

const createMVTLayer = (resourceId: number, layerOptions?: LayerOptions) => {
    const url =
        routeURL("feature_layer.mvt") +
        `?resource=${resourceId}&x={x}&y={y}&z={z}&nd=204`;
    const source = new VectorTileSource({
        format: new MVT(),
        url,
    });
    return new VectorTileLayer({
        source,
        ...layerOptions,
    });
};

export function useNGWLayer({
    layerType,
    resourceId,
    layerOptions,
}: {
    layerType: LayerType;
    resourceId: number;
    layerOptions?: LayerOptions;
}) {
    const layer = useMemo(() => {
        if (layerType === "geojson") {
            return createGeoJsonLayer(resourceId, layerOptions);
        } else if (layerType === "geotiff") {
            return createGeoTIFFLayer(resourceId);
        } else if (layerType === "MVT") {
            return createMVTLayer(resourceId, layerOptions);
        } else if (layerType === "XYZ") {
            return createXYZLayer(resourceId);
        } else {
            throw new Error(`Not supported layer type: ${layerType}`);
        }
    }, [layerOptions, layerType, resourceId]);
    return layer;
}
