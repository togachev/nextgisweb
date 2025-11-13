import { Button } from "@nextgisweb/gui/antd";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { EmptyComponent } from ".";
import { HomeStore } from "../HomeStore";
import { errorModal } from "@nextgisweb/gui/error";
import { gettext } from "@nextgisweb/pyramid/i18n";

import AddCircle from "@nextgisweb/icon/material/add_circle";

import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";
import { msgEmty } from "./msg";

interface StoreProps {
    store: HomeStore;
    icon?: boolean;
}

export const AddMap = observer((props: StoreProps) => {
    const { store, icon } = props;

    const { showResourcePicker } = useResourcePicker({ initParentId: 0 });

    const onMaps = useCallback(() => {
        showResourcePicker({
            pickerOptions: {
                requireClass: "webmap",
                multiple: true,
                clsFilter: "mapgroup_group",
            },
            onSelect: (resourceIds: number[]) => {
                if (!store.itemsMapsGroup.some(item => resourceIds.includes(item.webmap_id))) {
                    store.addMaps(resourceIds);
                } else {
                    return errorModal({
                        message: gettext("The web map has already been added to this group."),
                        title: gettext("Validation error"),
                    })
                }
            },
        });
    }, [showResourcePicker]);

    return (
        <div className="create-group">
            <Button icon={icon ? <AddCircle /> : undefined} type="text" onClick={onMaps}>
                <EmptyComponent {...{ text: msgEmty("group") }} />
            </Button>
        </div>
    )
});