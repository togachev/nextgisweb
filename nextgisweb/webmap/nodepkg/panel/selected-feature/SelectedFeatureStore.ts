import { action, computed, observable } from "mobx";
import { PanelStore } from "@nextgisweb/webmap/panel";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { route } from "@nextgisweb/pyramid/api";

import type { DataProps } from "./type";
import type { TreeItemConfig } from "@nextgisweb/webmap/type/TreeItems";
import type { Display } from "@nextgisweb/webmap/display";

type ItemsProps = {
    [key: string]: DataProps;
}

type SelectedFeaturesProps = {
    items: ItemsProps[];
    type: string;
    value: TreeItemConfig;
}

type Props = {
    [key: string]: SelectedFeaturesProps;
}

type SimulatePointZoomProps = {
    key: string;
    value: DataProps;
    type: string;
}

type ActiveLayerProps = {
    lchecked: boolean;
    lckey: string;
}

type ActiveCheckedProps = {
    achecked: boolean;
    ackey: string;
    acvalue: DataProps;
}

class SelectedFeatureStore extends PanelStore {

    display: Display;
    @observable accessor checked: boolean = true;
    @observable accessor visibleLayerName: boolean = true;
    @observable.ref accessor activeLayer: ActiveLayerProps;
    @observable.ref accessor activeChecked: ActiveCheckedProps;
    @observable.ref accessor selectedFeatures: Props;
    @observable.ref accessor simulatePointZoom: SimulatePointZoomProps;

    constructor(props) {
        super(props);
        this.display = props.display;

        const obj = {};
        getEntries(this.display.getItemConfig()).map(([key, value]) => {
            if (value.type === "layer") {
                Object.assign(obj, {
                    [key]: {
                        value: value,
                        styleId: value.styleId,
                        type: value.layerCls === "raster_layer" ? "raster" : "vector",
                        items: {},
                    },
                })
            }
        });

        this.selectedFeatures = obj;
        this.activeLayer = {
            lchecked: false,
            lckey: "",
        };
        this.activeChecked = {
            achecked: false,
            ackey: "",
            acvalue: {}
        };
    }

    @computed
    get countItems() {
        let count = 0;
        getEntries(this.selectedFeatures).map(([_, value]) => {
            count += Object.keys(value.items).length
        });
        return count;
    }

    @computed
    get countLayers() {
        let count = 0;
        getEntries(this.selectedFeatures).map(([_, value]) => {
            if (Object.keys(value.items).length > 0) {
                count += 1
            }
        });
        return count;
    }

    @action
    setChecked(checked: boolean) {
        this.checked = checked;
    }

    @action
    setVisibleLayerName(visibleLayerName: boolean) {
        this.visibleLayerName = visibleLayerName;
    }

    @action
    setActiveLayer(activeLayer: ActiveLayerProps) {
        this.activeLayer = activeLayer;
    }

    @action
    setActiveChecked(activeChecked: ActiveCheckedProps) {
        this.activeChecked = activeChecked;
    }

    @action
    setSelectedFeatures(selectedFeatures: Props) {
        this.selectedFeatures = selectedFeatures;
    }

    @action
    setSimulatePointZoom(simulatePointZoom: SimulatePointZoomProps) {
        this.simulatePointZoom = simulatePointZoom;
    }

    async getFeature(val) {
        const featureItem = await route("feature_layer.feature.item", {
            id: val.layerId,
            fid: val.id,
        }).get({
            cache: true,
            query: {
                extensions: false,
                fields: false,
            }
        });
        return featureItem;
    }
}

export default SelectedFeatureStore;