
import { useCallback, useEffect, useMemo, useState } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button } from "@nextgisweb/gui/antd";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";

const msgResetUrl = gettext("Reset url");

export const ButtonCheckboxGroup = (props) => {
    const { items, store, display } = props;
    const obj = items.reduce((acc, curr) => ({ ...acc, [curr.value]: false }), {});
    const urls = items.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.url }), {});

    const [status, setStatus] = useState(obj);
    const [activeKey, setActiveKey] = useState();

    // console.log(window.location.href, items.find(i => i.url === store.contextUrl).url);
    
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

    const propsUpdate = (itm) => {
        return {
            icon: !status[itm.value] ? itm.label : <LockReset />,
            onClick: () => onChange(itm.value),
            color: !status[itm.value] ? "defaut" : "primary",
            variant: "filled",
            type: "text",
            size: "small",
            title: status[itm.value] && activeKey ? msgResetUrl : "",
        }
    }

    return items.map((itm, index) => {
        return (
            <div key={index}>
                <Button {...propsUpdate(itm)} />
            </div>
        )
    })
};