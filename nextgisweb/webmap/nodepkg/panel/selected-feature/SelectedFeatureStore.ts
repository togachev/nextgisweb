import { action, observable } from "mobx";
import { PanelStore } from "@nextgisweb/webmap/panel";

import type { Display } from "@nextgisweb/webmap/display";
import type { DataProps } from "@nextgisweb/webmap/imodule/type";
import { getEntries } from "../../imodule/useSource";

class SelectedFeatureStore extends PanelStore {

    display: Display;
    @observable.ref accessor multiSelected: DataProps[] | undefined = [];
    @observable.ref accessor selectedFeatures: object;
    @observable accessor uniqueKey = true;
    @observable accessor rasterIncludes = false;

    constructor({ display, plugin, selectedFeatures }) {
        super({ display, plugin, selectedFeatures });
        this.display = display;
        this.getItems();
    }

    getItems = () => {
        const obj = {};
        getEntries(this.display.getItemConfig()).map(([_, value]) => {
            if (value.type === "layer") {
                Object.assign(obj, {
                    [value.styleId]: {
                        value: value,
                        type: value.layerCls === "raster_layer" ? "raster" : "vector",
                        checked: true, items: {}
                    },
                })
            }
        });
        this.setSelectedFeatures(obj);
    }

    @action
    setMultiSelected(multiSelected: DataProps[] | undefined) {
        this.multiSelected = multiSelected;
    }

    @action
    setSelectedFeatures(selectedFeatures: object) {
        this.selectedFeatures = selectedFeatures;
    }

    @action
    setUniqueKey(uniqueKey: boolean) {
        this.uniqueKey = uniqueKey;
    }

    @action
    setRasterIncludes(rasterIncludes: boolean) {
        this.rasterIncludes = rasterIncludes;
    }
}

export default SelectedFeatureStore;
