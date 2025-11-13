import { Button, Input, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { EmptyComponent } from ".";
import { HomeStore } from "../HomeStore";

import AddCircle from "@nextgisweb/icon/material/add_circle";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import Save from "@nextgisweb/icon/material/save";

import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";
import { msgEmty } from "./msg";

interface StoreProps {
    store: HomeStore;
    icon?: boolean;
}

export const AddGroup = observer((props: StoreProps) => {
    const { store, icon } = props;

    const { showResourcePicker } = useResourcePicker({ initParentId: 0 });

    const [showInput, setShowInput] = useState(false);
    const [value, setValue] = useState<string>("");

    const onGroups = useCallback((display_name: string) => {
        showResourcePicker({
            pickerOptions: {
                requireClass: "resource_group",
                initParentId: 0,
                clsFilter: "add_mapgroup_group",
            },
            onSelect: (resourceId: number) => {
                store.setParent(resourceId);
                store.createNewGroup(display_name);
                setShowInput(false);
            },
        });
    }, [showResourcePicker]);

    return (
        <div className="create-group">
            {!showInput &&
                <Button icon={icon ? <AddCircle /> : undefined} type="text" onClick={() => setShowInput(true)}>
                    <EmptyComponent {...{ text: msgEmty("group") }} />
                </Button>
            }

            {showInput &&
                <Space.Compact align="baseline" block >
                    <Button
                        icon={<Cancel />}
                        onClick={() => setShowInput(false)}
                    />
                    <Input
                        allowClear
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                        placeholder={gettext("Enter the group name")}
                    />
                    <Button
                        disabled={value !== "" ? false : true}
                        onClick={() => {
                            onGroups(value);
                        }}
                        icon={<Save />}
                    />
                </Space.Compact>
            }
        </div>
    )
});