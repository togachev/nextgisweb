import { useEffect } from "react";
import { WKT } from "ol/format";
import type { Display } from "@nextgisweb/webmap/display";
import type SelectedFeatureStore from "./SelectedFeatureStore";

export const useSelected = (display: Display, store: SelectedFeatureStore) => {
    const psizey = window.innerHeight;
    const psizex = 350;
    
    const simulateEvent = (p, pixel) => ({
        coordinate: p && p.coordinate,
        map: display.map.olMap,
        target: "map",
        pixel: [
            display.panelManager.getActivePanelName() !== "none" ?
                (pixel[0] + psizex + 40) :
                (pixel[0] + psizey + 40), (pixel[1] + 40)
        ],
        type: "click"
    });

    const overlayInfo = (event, p) => display.imodule._overlayInfo(event, "popup", p, "selected");

    const visibleItems = ({ value }) => {
        const visibleStyles: number[] = [];
        const itemConfig = display.getItemConfig();
        if (value && store.checked === true) {
            Object.keys(itemConfig).forEach(function (key) {
                if (value.includes(itemConfig[key].styleId)) {
                    visibleStyles.push(itemConfig[key].id);
                }
            });
        } else {
            display.config.checkedItems.forEach(function (key) {
                visibleStyles.push(itemConfig[key].id);
            });
        }
        display.webmapStore.setChecked(visibleStyles);
        display.webmapStore._updateLayersVisibility(visibleStyles);
    };

    const vectorRender = () => {
        const { key, value } = store.simulatePointZoom;
        const val = { params: [] };
        const coordinate = display.map.olMap.getView().getCenter();
        const p = { point: false, value: val, coordinate: coordinate, selected: key, data: value };
        const pixel = display.map.olMap.getPixelFromCoordinate(coordinate);
        const event = simulateEvent(p, pixel);
        overlayInfo(event, p);
    };

    const rasterRender = () => {
        const { key, value } = store.simulatePointZoom;
        const val = { params: [] };
        const p = { point: true, value: val, coordinate: value.coordinate, selected: key, data: value };
        const pixel = display.map.olMap.getPixelFromCoordinate(value.coordinate);
        const event = simulateEvent(p, pixel);
        overlayInfo(event, p);
    };

    useEffect(() => {
        if (store.simulatePointZoom) {
            const { type, value } = store.simulatePointZoom;
            if (type === "vector") {
                store.getFeature(value)
                    .then(i => {
                        const _wkt = new WKT();
                        const geometry = _wkt.readGeometry(i.geom);
                        const extent = geometry.getExtent();
                        display.imodule.zoomToExtent(extent);
                    });
                display.imodule.root_point_click.render();
                vectorRender();
            } else if (type === "raster") {
                display.imodule.zoomToPoint(value.coordinate);
                rasterRender();
            }
            display.map.olMap.renderSync();
        }
    }, [store.simulatePointZoom]);

    return { visibleItems };
};