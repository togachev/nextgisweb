import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { CheckboxValue, InputValue } from "@nextgisweb/gui/antd";
import { LotMV } from "@nextgisweb/gui/arm";
import { FocusTable, action } from "@nextgisweb/gui/focus-table";
import type { FocusTablePropsActions } from "@nextgisweb/gui/focus-table";
import { Area } from "@nextgisweb/gui/mayout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ResourceSelect } from "@nextgisweb/resource/component";
import { useFocusTablePicker } from "@nextgisweb/resource/component/resource-picker";
import type { EditorWidget } from "@nextgisweb/resource/type";

import { WebMap } from "./WebMap";
import type { WebMapStore } from "./WebMapStore";

const MapgroupWidget = observer<{
    item: WebMap;
}>(({ item }) => {
    return (
        <Area pad>
            <LotMV
                label={gettext("Display name")}
                value={item.displayName}
                component={InputValue}
            />
            <LotMV
                value={item.enabled}
                component={CheckboxValue}
                props={{ children: gettext("Enable mapgroup") }}
            />
            <LotMV
                label={gettext("Resource")}
                value={item.resourceId}
                component={ResourceSelect}
                props={{
                    readOnly: true,
                    style: { width: "100%" },
                    pickerOptions: {
                        initParentId: item.store.composite.parent,
                    },
                }}
            />
        </Area>
    );
});

MapgroupWidget.displayName = "MapgroupWidget";

export const WebMapWidget: EditorWidget<WebMapStore> = observer(({ store }) => {
    const { pickToFocusTable } = useFocusTablePicker({
        initParentId: store.composite.parent || undefined,
    });

    const { tableActions, itemActions } = useMemo<
        FocusTablePropsActions<WebMap>
    >(
        () => ({
            tableActions: [
                pickToFocusTable(
                    (res) => {
                        return new WebMap(store, {
                            resource_id: res.resource.id,
                            display_name: res.resource.display_name,
                            enabled: true,
                        });
                    },
                    {
                        pickerOptions: {
                            requireClass: "mapgroup_resource",
                            multiple: true,
                            clsFilter: "mapgroup_webmap",
                        },
                    }
                ),
            ],
            itemActions: [action.deleteItem()],
        }),
        [pickToFocusTable, store]
    );

    return (
        <FocusTable<WebMap>
            store={store}
            title={(item) => item.displayName.value}
            columns={[]}
            canDragAndDrop={false}
            tableActions={tableActions}
            itemActions={itemActions}
            renderDetail={({ item }) => <MapgroupWidget item={item} />}
        />
    );
});

WebMapWidget.displayName = "WebMapWidget";
WebMapWidget.title = gettext("Web Map Groups");
