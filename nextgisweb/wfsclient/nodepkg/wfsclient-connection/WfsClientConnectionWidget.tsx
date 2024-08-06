import { observer } from "mobx-react-lite";

import { InputValue, PasswordValue, Select } from "@nextgisweb/gui/antd";
import { LotMV } from "@nextgisweb/gui/arm";
import { Area } from "@nextgisweb/gui/mayout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type {
    EditorWidgetComponent,
    EditorWidgetProps,
} from "@nextgisweb/resource/type";

import type { WfsClientConnectionStore } from "./WfsClientConnectionStore";

const versionOptions = [
    { label: "1.0.0", value: "1.0.0" },
    { label: "1.1.0", value: "1.1.0" },
    { label: "2.0.0", value: "2.0.0" },
    { label: "2.0.2", value: "2.0.2" },
];

export const WfsClientConnectionWidget: EditorWidgetComponent<
    EditorWidgetProps<WfsClientConnectionStore>
> = observer(({ store }) => {
    return (
        <Area pad cols={["1fr", "1fr"]}>
            <LotMV
                row
                label={gettext("URL")}
                component={InputValue}
                value={store.path}
            />

            <LotMV
                label={gettext("Username")}
                component={InputValue}
                value={store.username}
            />

            <LotMV
                label={gettext("Password")}
                component={PasswordValue}
                value={store.password}
            />

            <LotMV
                row
                label={gettext("Version")}
                component={Select}
                value={store.version}
                props={{
                    options: versionOptions,
                    style: { width: "100%" },
                }}
            />
        </Area>
    );
});

WfsClientConnectionWidget.title = gettext("WFS connection");
WfsClientConnectionWidget.order = 10;
WfsClientConnectionWidget.displayName = "WfsClientConnectionWidget";
