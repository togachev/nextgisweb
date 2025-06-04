import { action, observable } from "mobx";

import { PanelStore } from "@nextgisweb/webmap/panel";

import type { DataProps } from "@nextgisweb/webmap/imodule/type";

class SelectedFeatureStore extends PanelStore {

    @observable.ref accessor multiSelected: DataProps[] | undefined = [];

    @action
    setMultiSelected(multiSelected: DataProps[] | undefined) {
        this.multiSelected = multiSelected;
    }
}

export default SelectedFeatureStore;
