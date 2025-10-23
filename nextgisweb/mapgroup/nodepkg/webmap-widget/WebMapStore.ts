import { action, computed, observable, observe } from "mobx";

import type * as apitype from "@nextgisweb/mapgroup/type/api";
import type { FocusTableStore } from "@nextgisweb/gui/focus-table";
import type { CompositeStore } from "@nextgisweb/resource/composite/CompositeStore";
import type {
    EditorStore,
    EditorStoreOptions,
} from "@nextgisweb/resource/type";

import { WebMap } from "./WebMap";

type Value = apitype.MapgroupWebMapRead;

export class WebMapStore
    implements EditorStore<Value>, FocusTableStore<WebMap>
{
    readonly identity = "mapgroup_webmap";
    readonly composite: CompositeStore;

    @observable.ref accessor dirty = false;
    @observable.ref accessor validate = false;

    readonly mapgroups = observable.array<WebMap>([], { deep: false });

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
        observe(this.mapgroups, () => this.markDirty());
    }

    @action
    load({ mapgroups }: Value) {
        this.mapgroups.replace(mapgroups.map((v) => new WebMap(this, v)));
        this.dirty = false;
    }

    dump() {
        if (!this.dirty) return undefined;
        return { mapgroups: this.mapgroups.map((i) => i.json()) };
    }

    @action
    markDirty() {
        this.dirty = true;
    }

    @computed
    get isValid(): boolean {
        return this.mapgroups.every((i) => i.error === false);
    }

    @computed
    get counter() {
        return this.mapgroups.length;
    }

    // FocusTableStore

    getItemChildren(item: WebMap | null) {
        return item === null ? this.mapgroups : undefined;
    }

    getItemContainer(item: WebMap) {
        return item && this.mapgroups;
    }

    getItemParent() {
        return null;
    }

    getItemError(item: WebMap) {
        return item.error;
    }
}
