import { makeObservable } from "mobx";

import { mapper, validate } from "@nextgisweb/gui/arm";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type {
    EditorStore,
    EditorStoreOptions,
    Operation,
} from "@nextgisweb/resource/type/EditorStore";
import type { ResourceRef } from "@nextgisweb/resource/type/api";

const msgUpdate = gettext("Fields need to be updated due to autodetection");

interface Value {
    connection: ResourceRef | null;
    schema: string;
    table: string;
    column_id: string;
    fields: "keep" | "update";
}

const {
    connection,
    schema,
    table,
    column_id: columnId,
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

fields.validate((v,s) => {
    if (v === "keep" && (!s.schema.value || !s.table.value)) {
        return [false, msgUpdate];
    }
    return [true, undefined];
});

export class LayerStore implements EditorStore<Value> {
    readonly identity = "tablenogeom_layer";
    readonly operation: Operation;

    dirty = false;
    validate = false;

    connection = connection.init(null, this);
    schema = schema.init("", this);
    table = table.init("", this);
    columnId = columnId.init("", this);
    fields = fields.init("update", this);

    constructor({ operation }: EditorStoreOptions) {
        this.operation = operation;
        makeObservable(this, {
            dirty: true,
            validate: true,
            load: true,
            markDirty: true,
            isValid: true,
        });
    }

    load(value: Value) {
        load(this, value);
        this.fields.value = "keep";
        this.dirty = false;
    }

    dump(): Value | undefined {
        if (!this.dirty) return undefined;
        return {
            ...this.connection.jsonPart(),
            ...this.schema.jsonPart(),
            ...this.table.jsonPart(),
            ...this.columnId.jsonPart(),
            ...this.fields.jsonPart(),
            ...(this.operation !== "create" && {}),
        };
    }

    markDirty() {
        this.dirty = true;
    }

    get isValid(): boolean {
        this.validate = true;
        return error(this) === false;
    }
}
