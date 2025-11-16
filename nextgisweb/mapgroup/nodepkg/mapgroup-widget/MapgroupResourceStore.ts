import { action, computed, observable } from "mobx";

import type {
    MapgroupResourceCreate,
    MapgroupResourceRead,
    MapgroupResourceUpdate,
} from "@nextgisweb/mapgroup/type/api";
import { mapper } from "@nextgisweb/gui/arm";

import type { CompositeStore } from "@nextgisweb/resource/composite/CompositeStore";
import type { EditorStore, EditorStoreOptions } from "@nextgisweb/resource/type";

const {
    enabled,
    $load: mapperLoad,
    $error: mapperError,
    $dirty: mapperDirty,
    $dump: mapperDump,
} = mapper<MapgroupResourceStore, MapgroupResourceRead>({
    validateIf: (o) => o.validate,
});

export class MapgroupResourceStore
    implements
        EditorStore<MapgroupResourceRead, MapgroupResourceCreate, MapgroupResourceUpdate>
{
    readonly identity = "mapgroup_resource";
    readonly composite: CompositeStore;

    readonly enabled = enabled.init(true, this);

    @observable.ref accessor loaded = false;
    @observable.ref accessor validate = false;

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
    }

    @action
    load(value: MapgroupResourceRead) {
        mapperLoad(this, value);
        this.loaded = true;
    }

    dump(): MapgroupResourceCreate | MapgroupResourceUpdate | undefined {
        return this.dirty ? mapperDump(this) : undefined;
    }

    @computed
    get dirty() {
        return mapperDirty(this);
    }

    @computed
    get isValid() {
        return !mapperError(this);
    }
}
