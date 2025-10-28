import { action, computed, observable, observe } from "mobx";

import type * as apitype from "@nextgisweb/mapgroup/type/api";
import type { FocusTableStore } from "@nextgisweb/gui/focus-table";
import type { CompositeStore } from "@nextgisweb/resource/composite/CompositeStore";
import type {
    EditorStore,
    EditorStoreOptions,
} from "@nextgisweb/resource/type";

import { Groupmap } from "./Groupmap";

type Value = apitype.MapgroupGroupRead;

export class GroupStore
    implements EditorStore<Value>, FocusTableStore<Groupmap>
{
    readonly identity = "mapgroup_group";
    readonly composite: CompositeStore;

    @observable.ref accessor dirty = false;
    @observable.ref accessor validate = false;

    readonly groupmaps = observable.array<Groupmap>([], { deep: false });

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
        observe(this.groupmaps, () => this.markDirty());
    }

    @action
    load({ groupmaps }: Value) {
        this.groupmaps.replace(groupmaps.map((v) => new Groupmap(this, v)));
        this.dirty = false;
    }

    dump() {
        if (!this.dirty) return undefined;
        return { groupmaps: this.groupmaps.map((i) => i.json()) };
    }

    @action
    markDirty() {
        this.dirty = true;
    }

    @computed
    get isValid(): boolean {
        return this.groupmaps.every((i) => i.error === false);
    }

    @computed
    get counter() {
        return this.groupmaps.length;
    }

    // FocusTableStore

    getItemChildren(item: Groupmap | null) {
        return item === null ? this.groupmaps : undefined;
    }

    getItemContainer(item: Groupmap) {
        return item && this.groupmaps;
    }

    getItemParent() {
        return null;
    }

    getItemError(item: Groupmap) {
        return item.error;
    }
}
