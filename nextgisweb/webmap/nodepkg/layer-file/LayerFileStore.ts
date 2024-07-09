import { makeAutoObservable, toJS } from "mobx";

import type { UploaderMeta } from "@nextgisweb/file-upload/file-uploader";
import { routeURL } from "@nextgisweb/pyramid/api";
import type {
    EditorStoreOptions,
    EditorStore as IEditorStore,
} from "@nextgisweb/resource/type/EditorStore";

interface Value {
    layer_file: string | null;
}


export class LayerFileStore implements IEditorStore<Value | null> {
    identity = "layerFile";
    layer_file: string | null = null;
    dirty = false;

    constructor() {
        makeAutoObservable(this, { identity: false });
    }

    load(value: Value | null) {
        if (value) {
            this.layer_file = value.layer_file;
        }
        this.dirty = false;
    }

    dump() {
        const result = {
            layer_file: "test",
        };
        return toJS(result);
    }

    get isValid() {
        return true;
    }

    update(data: Partial<LayerFileStore>) {
        for (const [k, v] of Object.entries(data)) {
            if (k in this) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this as any)[k] = v;
            }
        }
        this.dirty = true;
    }
}
