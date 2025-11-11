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

import { Groupmap } from "./Groupmap";
import type { GroupStore } from "./GroupStore";

const GroupmapWidget = observer<{
    item: Groupmap;
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
                props={{ children: gettext("Enable webmap") }}
            />
            <LotMV
                label={gettext("Resource")}
                value={item.webmapId}
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

GroupmapWidget.displayName = "GroupmapWidget";

export const GroupWidget: EditorWidget<GroupStore> = observer(({ store }) => {
    const { pickToFocusTable } = useFocusTablePicker({
        initParentId: store.composite.parent || undefined,
    });
    console.log(store);
    
    const { tableActions, itemActions } = useMemo<
        FocusTablePropsActions<Groupmap>
    >(
        () => ({
            tableActions: [
                pickToFocusTable(
                    (res) => {
                        return new Groupmap(store, {
                            webmap_id: res.resource.id,
                            display_name: res.resource.display_name,
                            enabled: true,
                        });
                    },
                    {
                        pickerOptions: {
                            requireClass: "webmap",
                            multiple: true,
                            clsFilter: "mapgroup_group",
                        },
                    }
                ),
            ],
            itemActions: [action.deleteItem()],
        }),
        [pickToFocusTable, store]
    );

    return (
        <FocusTable<Groupmap>
            store={store}
            title={(item) => item.displayName.value}
            columns={[]}
            canDragAndDrop={false}
            tableActions={tableActions}
            itemActions={itemActions}
                renderDetail={({ item }) => {
                    console.log(item);

                    return (<GroupmapWidget item={item} />)
                }}
        />
    );
});

GroupWidget.displayName = "GroupWidget";
GroupWidget.title = gettext("Webmaps");
GroupWidget.tabOn = { tab: "maps" };
