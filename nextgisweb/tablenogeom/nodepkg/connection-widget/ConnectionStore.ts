import { action, computed, observable } from "mobx";

import { mapper, validate } from "@nextgisweb/gui/arm";
import type { TablenogeomConnectionRead } from "@nextgisweb/tablenogeom/type/api";
import type { EditorStore } from "@nextgisweb/resource/type";

const {
    hostname,
    port,
    sslmode,
    username,
    password,
    database,
    $load: load,
    $error: error,
} = mapper<ConnectionStore, Required<TablenogeomConnectionRead>>({
    validateIf: (o) => o.validate,
    onChange: (o) => o.markDirty(),
});

hostname.validate(validate.string({ minLength: 1 }));
username.validate(validate.string({ minLength: 1 }));
password.validate(validate.string({ minLength: 1 }));
database.validate(validate.string({ minLength: 1 }));

export class ConnectionStore implements EditorStore<TablenogeomConnectionRead> {
    readonly identity = "tablenogeom_connection";

    readonly hostname = hostname.init("", this);
    readonly port = port.init(null, this);
    readonly sslmode = sslmode.init(null, this);
    readonly username = username.init("", this);
    readonly password = password.init("", this);
    readonly database = database.init("", this);

    @observable.ref accessor dirty = false;
    @observable.ref accessor validate = false;

    @action
    load(value: TablenogeomConnectionRead) {
        load(this, value);
        this.dirty = false;
    }

    dump(): TablenogeomConnectionRead | undefined {
        if (!this.dirty) return undefined;
        return {
            ...this.hostname.jsonPart(),
            ...this.port.jsonPart(),
            ...this.sslmode.jsonPart(),
            ...this.username.jsonPart(),
            ...this.password.jsonPart(),
            ...this.database.jsonPart(),
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
