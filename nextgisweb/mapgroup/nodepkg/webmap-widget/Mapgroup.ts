import type * as apitype from "@nextgisweb/mapgroup/type/api";
import { mapper, validate } from "@nextgisweb/gui/arm";
import type { ErrorResult } from "@nextgisweb/gui/arm";

import type { WebMapStore } from "./WebMapStore";

const {
    resource_id: resourceId,
    display_name: displayName,
    enabled_group: enabledGroup,
    $load: mapperLoad,
    $error: mapperError,
} = mapper<Mapgroup, apitype.MapgroupWebMapItemRead>({
    validateIf: (o) => o.store.validate,
    onChange: (o) => o.store.markDirty(),
});

displayName.validate(
    validate.string({ minLength: 1 }),
    validate.unique((o) => o.store.groups, "displayName")
);

export class Mapgroup {
    readonly store: WebMapStore;

    resourceId = resourceId.init(-1, this);
    displayName = displayName.init("", this);
    enabledGroup = enabledGroup.init(false, this);

    constructor(store: WebMapStore, data: apitype.MapgroupWebMapItemRead) {
        this.store = store;
        mapperLoad(this, data);
    }

    json(): apitype.MapgroupWebMapItemRead {
        return {
            ...this.resourceId.jsonPart(),
            ...this.displayName.jsonPart(),
            ...this.enabledGroup.jsonPart(),
        };
    }

    get error(): ErrorResult {
        return mapperError(this);
    }
}
