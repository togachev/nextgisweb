import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import FitToScreenOutline from "@nextgisweb/icon/mdi/fit-to-screen-outline";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";

import type { ControlUrlProps } from "../type";

export const UrlButton = observer(({ store }) => {

    const [activeKey, setActiveKey] = useState<string>();
    const [control, setControl] = useState<ControlUrlProps>({
        reset: {
            icon: <LockReset />,
            title: gettext("Reset url"),
            status: false,
        }
    });

    useMemo(() => {
        setControl({
            ...control,
            popup: {
                icon: <UpdateLink />,
                url: store.contextUrl,
                title: gettext("Update current web map address"),
                status: false,
            },
            fixedscreen: {
                icon: <FitToScreenOutline />,
                url: store.permalink,
                title: gettext("Set current map coverage"),
                status: false,
            }
        })
    }, [store.permalink, store.contextUrl]);

    const onClick = (name) => {
        setActiveKey(name);
        const values = { ...control }
        Object.keys(values).forEach((key) => {
            if (key === name) {
                values[key].status = !values[key].status;
            } else {
                values[key].status = false;
            }
        })
        setControl(values);
    };
    console.log(activeKey, control[activeKey]);
    
    const propsUpdate = (name, value) => {
        return {
            icon: value.icon,
            onClick: () => onClick(name),
            color: value.status ? "primary" : "defaut",
            variant: "filled",
            type: "text",
            size: "small",
            title: value.title,
        }
    }

    return control && getEntries(control).map(([name, value], index) => {
        return (
            <div key={index}>
                <Button {...propsUpdate(name, value)} />
            </div>
        )
    })
});