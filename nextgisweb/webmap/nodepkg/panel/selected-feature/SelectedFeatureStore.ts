import { action, observable } from "mobx";
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
    value: TreeItemConfig
}

type Props = {
    [key: string]: SelectedFeaturesProps;
}

type SimulatePointZoomProps = {
    key: string;
    value: DataProps;
    type: string;
}

class SelectedFeatureStore extends PanelStore {

    display: Display;
    @observable accessor checked: boolean = false;
    @observable.ref accessor selectedFeatures: Props;
    @observable.ref accessor activeKey: string;
    @observable.ref accessor simulatePointZoom: SimulatePointZoomProps;

    constructor(props) {
        super(props);
        this.display = props.display;
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
                        items: {},
                    },
                })
            }
        });
        this.setSelectedFeatures(obj);
    }

    @action
    setChecked(checked: boolean) {
        this.checked = checked;
    }

    @action
    setSelectedFeatures(selectedFeatures: Props) {
        this.selectedFeatures = selectedFeatures;
    }

    @action
    setActiveKey(activeKey: string) {
        this.activeKey = activeKey;
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