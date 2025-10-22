import type * as apitype from "@nextgisweb/mapgroup/type/api";
import { mapper, validate } from "@nextgisweb/gui/arm";
import type { ErrorResult } from "@nextgisweb/gui/arm";

import type { GroupStore } from "./GroupStore";

const {
    webmap_id: webmapId,
    display_name: displayName,
    enabled: enabled,
    $load: mapperLoad,
    $error: mapperError,
} = mapper<Groupmap, apitype.WebMapMapgroupItemRead>({
    validateIf: (o) => o.store.validate,
    onChange: (o) => o.store.markDirty(),
});

displayName.validate(
    validate.string({ minLength: 1 }),
    validate.unique((o) => o.store.maps, "displayName")
);

export class Groupmap {
    readonly store: GroupStore;

    webmapId = webmapId.init(-1, this);
    displayName = displayName.init("", this);
    enabled = enabled.init(false, this);

    constructor(store: GroupStore, data: apitype.WebMapMapgroupItemRead) {
        this.store = store;
        mapperLoad(this, data);
    }

    json(): apitype.WebMapMapgroupItemRead {
        return {
            ...this.webmapId.jsonPart(),
            ...this.displayName.jsonPart(),
            ...this.enabled.jsonPart(),
        };
    }

    get error(): ErrorResult {
        return mapperError(this);
    }
}
