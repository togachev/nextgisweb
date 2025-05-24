
import { useCallback, useEffect, useMemo, useState } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";

export const ButtonCheckboxGroup = (props) => {
    const { items, store, display } = props;
    const obj = items.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.status }), {});
    const urls = items.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.url }), {});

    const [status, setStatus] = useState(obj);
    const [activeKey, setActiveKey] = useState();

    useMemo(() => {
        setStatus(obj);
        store.updatePermalink();
    }, [store]);

    useEffect(() => {
        switch (status[activeKey]) {
            case true:
                window.history.pushState({}, "", urls[activeKey]);
                break;
            case false:
                window.history.pushState({}, "", ngwConfig.applicationUrl + routeURL("webmap.display", display.config.webmapId));
                break;
        }
    }, [status])

    const onChange = useCallback((name) => {
        getEntries(status).map(([key, _]) => {
            setStatus(prev => {
                if (key === name) {
                    setActiveKey(key)
                    return { ...prev, [key]: !prev[key] }
                } else {
                    return { ...prev, [key]: false }
                }
            });
        })
    }, []);

    const propsUpdate = (item) => {
        return {
            icon: status[item.value] ? <LockReset /> : item.label,
            onClick: () => onChange(item.value),
            color: status[item.value] ? "primary" : "defaut",
            variant: "filled",
            type: "text",
            size: "small",
            title: status[item.value] ? gettext("Reset url") : item.title,
        }
    }

    return items.map((item, index) => {
        return (
            <div key={index}>
                <Button {...propsUpdate(item)} />
            </div>
        )
    })
};