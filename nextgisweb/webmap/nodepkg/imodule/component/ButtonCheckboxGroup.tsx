
import { useEffect, useReducer, useCallback, useState } from "react";
import { Button } from "@nextgisweb/gui/antd";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { useComponent } from "../useSource";

import type { BaseButtonProps } from "@nextgisweb/gui/antd";


interface resetProps {
    reset: boolean;
    resetExtent: boolean;
}

export const ButtonCheckboxGroup = (props: BaseButtonProps) => {

    const { icons, store } = props;

    const resets = {};

    icons.map(item => {
        console.log(item);

        const name = item.value
        resets[name] = false
    });

    const [status, setStatus] = useState(resets);
    console.log(status);
    
    const valueCheckbox = (name) => {
        getEntries(status).map(([key, value]) => {
            setStatus(prev => {
                if (key === name) {
                    return { ...prev, [key]: true }
                }
                else {
                    return { ...prev, [key]: false }
                }
            });
        })
    };

    const propsUpdate = (itm) => {
        return {
            icon: !status[itm.value] ? itm.label : < LockReset />,
            // title: msgUpdate.join("\n"),
            onClick: () => valueCheckbox(itm.value),
            color: !status[itm.value] ? "defaut" : "danger",
            variant: "filled",
            type: "text",
            size: "small",
        }
    }

    return icons.map((itm, index) => {
        return (
            <div key={index}>
                <Button disabled={itm.disabled} {...propsUpdate(itm)} />
            </div>
        )
    })
};