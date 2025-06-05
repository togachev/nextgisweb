import { action, observable } from "mobx";

import { PanelStore } from "@nextgisweb/webmap/panel";

import type { DataProps } from "@nextgisweb/webmap/imodule/type";

class SelectedFeatureStore extends PanelStore {

    @observable.ref accessor multiSelected: DataProps[] | undefined = [];
    @observable accessor uniqueKey = false;

    @action
    setMultiSelected(multiSelected: DataProps[] | undefined) {
        this.multiSelected = multiSelected;
    }
    @action
    setUniqueKey(uniqueKey: boolean) {
        this.uniqueKey = uniqueKey;
    }
}

export default SelectedFeatureStore;
