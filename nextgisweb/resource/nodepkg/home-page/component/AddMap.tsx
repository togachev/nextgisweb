import { CheckboxValue, InputValue, Button, Input, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useCallback, useState } from "react";
import { EmptyComponent } from ".";
import { route } from "@nextgisweb/pyramid/api";
import { HomeStore } from "../HomeStore";
import { errorModal } from "@nextgisweb/gui/error";
import { LotMV } from "@nextgisweb/gui/arm";
import { FocusTable, action } from "@nextgisweb/gui/focus-table";
import type { FocusTablePropsActions } from "@nextgisweb/gui/focus-table";
import { Area } from "@nextgisweb/gui/mayout";
import AddCircle from "@nextgisweb/icon/material/add_circle";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import Save from "@nextgisweb/icon/material/save";
import { useThemeVariables, useUnsavedChanges } from "@nextgisweb/gui/hook";
import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";
import { msgEmty } from "./msg";

import { ResourceSelect } from "@nextgisweb/resource/component";
import { useFocusTablePicker } from "@nextgisweb/resource/component/resource-picker";
import { Groupmap } from "@nextgisweb/mapgroup/group-widget/Groupmap";

interface StoreProps {
    store: HomeStore;
    empty?: boolean;
    icon?: boolean;
    text?: string;
}

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
                        initParentId: item.store.activeGroup.resource.parent,
                    },
                }}
            />
        </Area>
    );
});


export const AddMap = observer((props: StoreProps) => {
    const { store, empty, icon, text } = props;
    
    // const [composite] = useState(() => new CompositeStore({ setup }));
    const { pickToFocusTable } = useFocusTablePicker({
        initParentId: store.activeGroup.resource.parent || undefined,
    });
    const { members, dirty } = store.composite;
    const { disable: disableUnsavedChanges } = useUnsavedChanges({ dirty });
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

    useEffect(() => {
        store.composite.init().catch();
    }, [store.composite]);

    const save = useCallback(
        async (edit: boolean = false) => {

            let id;
            try {
                ({ id } = await store.composite.submit());
                console.log(id);

            } catch (err) {
                errorModal(err);
                return;
            }

            disableUnsavedChanges();
        },
        [store.composite, disableUnsavedChanges]
    );
console.log(store);
    return (
        <>
            {/* route(routeName, { id }).url() */}
            <Button
                onClick={() => {
                    save(false);
                }}
                icon={<Save />}
            />
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
            /></>
    );

    // const { showResourcePicker } = useResourcePicker({ initParentId: 0 });

    // const onMaps = useCallback(() => {
    //     showResourcePicker({
    //         pickerOptions: {
    //             requireClass: "webmap",
    //             multiple: true,
    //             clsFilter: "mapgroup_group",
    //         },
    //         onSelect: (resourceIds: number[]) => {
    //             store.addMaps(resourceIds);
    //         },
    //     });
    // }, [showResourcePicker]);

    // return (
    //     <div className={!icon ? "create-group" : "create-group-menu"}>
    //         {empty &&
    //             <EmptyComponent {...{ text: msgEmty("group") }} />
    //         }

    //         <Button icon={icon ? <AddCircle /> : undefined} type="text" onClick={onMaps}>{text}</Button>

    //     </div>
    // )
});