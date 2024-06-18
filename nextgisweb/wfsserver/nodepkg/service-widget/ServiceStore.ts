/* eslint-disable no-use-before-define */
import { makeObservable, observable, observe } from "mobx";

import type { FocusTableStore } from "@nextgisweb/gui/focus-table";
import type { EditorStore } from "@nextgisweb/resource/type/EditorStore";
import type { WFSServerLayer } from "@nextgisweb/wfsserver/type/api";

import { Layer } from "./Layer";

export interface Value {
    layers: WFSServerLayer[];
}

export class ServiceStore
    implements EditorStore<Value>, FocusTableStore<Layer>
{
    readonly identity = "wfsserver_service";

    dirty = false;
    validate = false;

    layers = observable.array<Layer>([]);

    constructor() {
        observe(this.layers, () => this.markDirty());
        makeObservable(this, {
            dirty: true,
            validate: true,
            load: true,
            markDirty: true,
            isValid: true,
        });
    }

    load({ layers }: Value) {
        this.layers.replace(layers.map((v) => new Layer(this, v)));
        this.dirty = false;
    }

    dump() {
        if (!this.dirty) return undefined as unknown as Value;
        return { layers: this.layers.map((i) => i.json()) };
    }

    markDirty() {
        this.dirty = true;
    }

    get isValid(): boolean {
        this.validate = true;
        return this.layers.every((i) => i.error === false);
    }

    // FocusTableStore

    getItemChildren(item: Layer | null) {
        return item === null ? this.layers : undefined;
    }

    getItemContainer(item: Layer) {
        return item && this.layers;
    }

    getItemParent() {
        return null;
    }

    getItemError(item: Layer) {
        return item.error;
    }
}
