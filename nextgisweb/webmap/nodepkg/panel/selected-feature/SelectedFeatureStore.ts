import { action, observable } from "mobx";
import { PanelStore } from "@nextgisweb/webmap/panel";
import { filterObject } from "@nextgisweb/webmap/imodule/useSource";

import type { Display } from "@nextgisweb/webmap/display";
import type { DataProps } from "@nextgisweb/webmap/imodule/type";

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
        this.setSelectedFeatures(filterObject(this.display.getItemConfig(), ([_, v]) => v.type === "layer"));
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
