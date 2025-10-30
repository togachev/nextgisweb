import { observer } from "mobx-react-lite";
import { CheckboxValue } from "@nextgisweb/gui/antd";
import { LotMV } from "@nextgisweb/gui/arm";
import { Area } from "@nextgisweb/gui/mayout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { EditorWidget } from "@nextgisweb/resource/type";

import type { MapgroupResourceStore } from "./MapgroupResourceStore";

export const MapgroupResourceWidget: EditorWidget<MapgroupResourceStore> = observer(({ store }) => {

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                height: "100%",
            }}
        >
            <div style={{ flex: "none" }}>
                <Area pad style={{ height: "100%" }} cols={["1fr", "1fr"]}>
                    <LotMV
                        label={false}
                        value={store.enabled}
                        component={CheckboxValue}
                        props={{
                            children: gettext(
                                "Enable mapgroup"
                            ),
                        }}
                    />
                </Area>
            </div>
        </div>
    );
});

MapgroupResourceWidget.displayName = "MapgroupResourceWidget";
MapgroupResourceWidget.title = gettext("Group");
MapgroupResourceWidget.activateOn = { create: true };
MapgroupResourceWidget.activateOn = { update: true };
