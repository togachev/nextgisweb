import { useEffect } from "react";

import type { Display } from "@nextgisweb/webmap/display";
import type SelectedFeatureStore from "./SelectedFeatureStore";

export const useSelected = (display: Display, store: SelectedFeatureStore) => {
    const pstore = display.popupStore;

    const visibleItems = ({ value }) => {
        const visibleStyles: number[] = [];
        const itemConfig = display.getItemConfig();
        const itemStore = display.itemStore;

        if (value && store.checked === true) {
            Object.keys(itemConfig).forEach(function (key) {
                if (value.includes(itemConfig[key].styleId)) {
                    visibleStyles.push(itemConfig[key].id);
                }
            });
        } else if (value && store.checked === false) {
            return new Promise(() => {
                itemStore.fetch({
                    query: { type: "layer" },
                    queryOptions: { deep: true },
                    onItem: (item) => {
                        if (item.styleId === value[0] && item.visibility === false) {
                            itemStore.setValue(item, "checked", true);
                        }
                    }
                });
            });
        } else {
            display.config.checkedItems.forEach(function (key) {
                visibleStyles.push(itemConfig[key].id);
            });
        }
        display.webmapStore.setChecked(visibleStyles);
        display.webmapStore._updateLayersVisibility(visibleStyles);
    };

    const render = () => {
        const { key, value } = store.simulatePointZoom;
        const { coordinate } = value.pointPopupClick
        const p = { point: true, value: value.props, coordinate: coordinate, selected: key };
        const panelSize = pstore.activePanel !== "none" ? (display.isMobile ? 0 : display.panelSize) : 0;

        display.map.olMap.once("postrender", function (e) {
            const pixel = e.map.getPixelFromCoordinate(coordinate);
            const simulateEvent: any = {
                coordinate: p && p.coordinate,
                map: e.map,
                target: "map",
                pixel: [
                    pixel[0] + panelSize + pstore.offHP, pixel[1] + pstore.offHP
                ],
                type: "selected"
            };
            pstore.overlayInfo(simulateEvent, { type: "selected", p: p });
        });

    };

    useEffect(() => {
        if (store.simulatePointZoom) {
            const { value } = store.simulatePointZoom;
            pstore.setPointPopupClick(value.pointPopupClick);

            pstore.zoomToExtent(value.extent);
            pstore.renderPoint({ coordinate: value.pointPopupClick.coordinate });
            render();

            display.map.olMap.renderSync();
        }
    }, [store.simulatePointZoom]);

    return { visibleItems };
};