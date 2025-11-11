// import { Button, Input, Space } from "@nextgisweb/gui/antd";
// import { gettext } from "@nextgisweb/pyramid/i18n";
import { observer } from "mobx-react-lite";
// import { useCallback, useState } from "react";
// import { EmptyComponent } from ".";
import { HomeStore } from "../HomeStore";

// import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";
// import { msgEmty } from "./msg";

interface StoreProps {
    store: HomeStore;
}

export const AddMap = observer((props: StoreProps) => {
    const { store } = props;
    console.log(store);
    
    // const { showResourcePicker } = useResourcePicker({ initParentId: 0 });

    return(
        <div>test add maps </div>
    )
});