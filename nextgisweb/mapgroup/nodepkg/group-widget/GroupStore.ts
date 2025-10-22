import { action, computed, observable, observe } from "mobx";

import type * as apitype from "@nextgisweb/mapgroup/type/api";
import type { FocusTableStore } from "@nextgisweb/gui/focus-table";
import type { CompositeStore } from "@nextgisweb/resource/composite/CompositeStore";
import type {
    EditorStore,
    EditorStoreOptions,
} from "@nextgisweb/resource/type";

import { Groupmap } from "./Groupmap";

type Value = apitype.WebMapGroupRead;

export class GroupStore
    implements EditorStore<Value>, FocusTableStore<Groupmap>
{
    readonly identity = "webmap_group";
    readonly composite: CompositeStore;

    @observable.ref accessor dirty = false;
    @observable.ref accessor validate = false;

    readonly maps = observable.array<Groupmap>([], { deep: false });

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
        observe(this.maps, () => this.markDirty());
    }

    @action
    load({ maps }: Value) {
        this.maps.replace(maps.map((v) => new Groupmap(this, v)));
        this.dirty = false;
    }

    dump() {
        if (!this.dirty) return undefined;
        return { maps: this.maps.map((i) => i.json()) };
    }

    @action
    markDirty() {
        this.dirty = true;
    }

    @computed
    get isValid(): boolean {
        return this.maps.every((i) => i.error === false);
    }

    @computed
    get counter() {
        return this.maps.length;
    }

    // FocusTableStore

    getItemChildren(item: Groupmap | null) {
        return item === null ? this.maps : undefined;
    }

    getItemContainer(item: Groupmap) {
        return item && this.maps;
    }

    getItemParent() {
        return null;
    }

    getItemError(item: Groupmap) {
        return item.error;
    }
}
