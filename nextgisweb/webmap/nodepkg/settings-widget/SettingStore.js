import { makeAutoObservable, toJS } from "mobx";

import { annotation, editing } from "@nextgisweb/pyramid/settings!webmap";

export class SettingStore {
    identity = "webmap";

    active_panel = "layers";
    draw_order_enabled = false;
    identify_order_enabled = false;
    editable = false;
    annotationEnabled = false;
    annotationDefault = "no";
    legendSymbols = null;
    measureSrs = null;

    dirty = false;

    constructor() {
        makeAutoObservable(this, { identity: false });
    }

    load(value) {
        this.root_item = value.root_item;
        this.root_item_id = value.root_item_id;
        this.layer_order = value.layer_order;
        this.active_panel = value.active_panel;
        this.draw_order_enabled = value.draw_order_enabled;
        this.identify_order_enabled = value.identify_order_enabled;
        this.editable = value.editable;
        this.annotationEnabled = !!value.annotation_enabled;
        this.annotationDefault = value.annotation_default;
        this.legendSymbols = value.legend_symbols;
        this.measureSrs = value.measure_srs ? value.measure_srs.id : null;

        this.dirty = false;
    }

    dump() {
        if (!this.dirty) return;
        const result = {
            legend_symbols: this.legendSymbols ? this.legendSymbols : null,
            measure_srs: this.measureSrs ? { id: this.measureSrs } : null,
        };
        result.active_panel = this.active_panel;
        result.draw_order_enabled = this.draw_order_enabled;
        result.identify_order_enabled = this.identify_order_enabled;
        if (editing) result.editable = this.editable;
        if (annotation) {
            result.annotation_enabled = this.annotationEnabled;
            result.annotation_default = this.annotationDefault;
        }
        return toJS(result);
    }

    get isValid() {
        return true;
    }

    update(source) {
        Object.entries(source).forEach(([key, value]) => (this[key] = value));
        this.dirty = true;
    }
}
