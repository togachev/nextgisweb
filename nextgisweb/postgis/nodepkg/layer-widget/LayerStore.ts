import { action, computed, observable, runInAction } from "mobx";

import { mapper, validate } from "@nextgisweb/gui/arm";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { CompositeStore } from "@nextgisweb/resource/composite";
import type {
    EditorStore,
    EditorStoreOptions,
    Operation,
} from "@nextgisweb/resource/type";
import type { ResourceRef } from "@nextgisweb/resource/type/api";
import srsSettings from "@nextgisweb/spatial-ref-sys/client-settings";

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

    column_geom: string;
    geometry_type: string | null;
    geometry_srid: number | null;
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

    column_geom: columnGeom,
    geometry_type: geometryType,
    geometry_srid: geometrySrid,
    fields: fields,
    $load: load,
    $error: error,
} = mapper<LayerStore, Value>({
    validateIf: (o) => o.validate,
    onChange: (o) => o.markDirty(),
});

[schema, table, columnId, columnGeom].forEach((i) =>
    i.validate(validate.string({ minLength: 1, maxLength: 64 }))
);

fields.validate((v, s) => {
    if (v === "keep" && (!s.geometryType.value || !s.geometrySrid.value)) {
        return [false, msgUpdate];
    }
    return [true, undefined];
});

export class LayerStore implements EditorStore<Value> {
    readonly identity = "postgis_layer";
    readonly operation: Operation;

    @observable accessor dirty = false;
    @observable accessor validate = false;

    connection = connection.init(null, this);
    connection_relation = connection_relation.init(null, this);
    schema = schema.init("", this);
    table = table.init("", this);
    columnId = columnId.init("", this);

    resourceFieldName = resourceFieldName.init("", this);
    externalFieldName = externalFieldName.init("", this);

    columnGeom = columnGeom.init("", this);
    geometryType = geometryType.init(null, this);
    geometrySrid = geometrySrid.init(null, this);
    fields = fields.init("update", this);

    readonly composite: CompositeStore;

    constructor({ operation, composite }: EditorStoreOptions) {
        this.operation = operation;
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

            ...this.columnGeom.jsonPart(),
            ...this.geometryType.jsonPart(),
            ...this.geometrySrid.jsonPart(),
            ...this.fields.jsonPart(),
            ...(this.operation === "create"
                ? { srs: srsSettings.default }
                : {}),
        };
    }

    @action
    markDirty() {
        this.dirty = true;
    }

    @computed
    get isValid(): boolean {
        runInAction(() => {
            runInAction(() => {
                this.validate = true;
            });
        });
        return error(this) === false;
    }
}
