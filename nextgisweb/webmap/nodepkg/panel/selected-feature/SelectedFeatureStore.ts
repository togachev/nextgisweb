import { action, observable } from "mobx";
import { PanelStore } from "@nextgisweb/webmap/panel";
import { getEntries } from "../../imodule/useSource";

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

class SelectedFeatureStore extends PanelStore {

    display: Display;
    @observable.ref accessor selectedFeatures: Props;

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
    setSelectedFeatures(selectedFeatures: Props) {
        this.selectedFeatures = selectedFeatures;
    }
}

export default SelectedFeatureStore;
