import { action, computed, observable } from "mobx";

import { mapper, validate } from "@nextgisweb/gui/arm";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { CompositeStore } from "@nextgisweb/resource/composite";
import type {
    EditorStore,
    EditorStoreOptions,
} from "@nextgisweb/resource/type";
import type { ResourceRef } from "@nextgisweb/resource/type/api";

const msgUpdate = gettext("Fields need to be updated due to autodetection");

interface Value {
    connection: ResourceRef | null;
    connection_relation: ResourceRef | null;
    schema: string;
    table: string;
    column_id: string;
    
    resource_field_name: string | null;
    external_field_name: string | null;
    external_resource_id: ResourceRef | null;
    fields: "keep" | "update";
}

const {
    connection,
    connection_relation,
    schema,
    table,
    column_id: columnId,

    resource_field_name: resourceFieldName,
    external_field_name: externalFieldName,

    fields: fields,
    $load: load,
    $error: error,
} = mapper<LayerStore, Value>({
    validateIf: (o) => o.validate,
    onChange: (o) => o.markDirty(),
});

[schema, table, columnId].forEach((i) =>
    i.validate(validate.string({ minLength: 1, maxLength: 64 }))
);

fields.validate((v, s) => {
    if (v === "keep" && (!s.schema.value || !s.table.value)) {
        return [false, msgUpdate];
    }
    return [true, undefined];
});

export class LayerStore implements EditorStore<Value> {
    readonly identity = "tablenogeom_layer";
    readonly composite: CompositeStore;

    readonly connection = connection.init(null, this);
    readonly connection_relation = connection_relation.init(null, this);
    readonly schema = schema.init("", this);
    readonly table = table.init("", this);
    readonly columnId = columnId.init("", this);

    readonly resourceFieldName = resourceFieldName.init("", this);
    readonly externalFieldName = externalFieldName.init("", this);

    readonly fields = fields.init("update", this);

    @observable.ref accessor dirty = false;
    @observable.ref accessor validate = false;

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
    }

    @action
    load(value: Value) {
        load(this, value);
        this.fields.value = "keep";
        this.dirty = false;
    }

    dump(): Value | undefined {
        if (!this.dirty) return undefined;
        return {
            ...this.connection.jsonPart(),
            ...this.connection_relation.jsonPart(),
            ...this.schema.jsonPart(),
            ...this.table.jsonPart(),
            ...this.columnId.jsonPart(),

            ...this.resourceFieldName.jsonPart(),
            ...this.externalFieldName.jsonPart(),

            ...this.fields.jsonPart(),
            ...(this.operation !== "create" && {}),
        };
    }

    @action
    markDirty() {
        this.dirty = true;
    }

    @computed
    get isValid(): boolean {
        return error(this) === false;
    }
}
