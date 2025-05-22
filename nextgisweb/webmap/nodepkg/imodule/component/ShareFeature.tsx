import { useState, useEffect } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, Space } from "@nextgisweb/gui/antd";
import { getPermalink } from "@nextgisweb/webmap/utils/permalink";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import ContentCopy from "@nextgisweb/icon/mdi/content-copy";
import UrlIcon from "@nextgisweb/icon/mdi/link";
import Fullscreen from "@nextgisweb/icon/mdi/fullscreen";

import "./ShareFeature.less"

import type { ContentProps } from "../type";

const msgUpdate = [
    gettext("Update web map url."),
];

export const ShareFeature = observer((props) => {
    const { display, store } = props as ContentProps;
    const { copyValue, contextHolder } = useCopy();

    const [url, setUrl] = useState(store.contextUrl);
    const [reset, setReset] = useState(true);
    const [resetExtent, setResetExtent] = useState(true);

    const handleClickUpdate = () => {
        setReset(!reset);
    };

    const handleClickUpdateExtent = () => {
        setResetExtent(!resetExtent);
    };

    const handleClickCopy = (e, type) => {
        const messageClickCopy = store.countFeature > 0 ? gettext("Object reference copied") : gettext("Location link copied");
        const messageContextMenuCopy = gettext("Current web map coverage copied");
        e.preventDefault();
        switch (type) {
            case "popup":
                copyValue(store.contextUrl, messageClickCopy);
                break;
            case "extent":
                display.getVisibleItems().then((visibleItems) => {
                    const permalink = getPermalink({ display, visibleItems });
                    copyValue(decodeURIComponent(permalink), messageContextMenuCopy);
                });
                break;
        }
    };

    useEffect(() => {
        switch (reset) {
            case false:
                window.history.pushState({}, "", url);
                break;
            case true:
                window.history.pushState({}, "", routeURL("webmap.display", display.config.webmapId));
                break;
        }
    }, [reset])

    useEffect(() => {
        switch (resetExtent) {
            case false:
                display.getVisibleItems().then((visibleItems) => {
                    const permalink = getPermalink({ display, visibleItems });
                    window.history.pushState({}, "", decodeURIComponent(permalink));
                    setUrl(decodeURIComponent(permalink))
                });
                break;
            case true:
                window.history.pushState({}, "", routeURL("webmap.display", display.config.webmapId));
                break;
        }
    }, [resetExtent])

    return (<>
        {contextHolder}
        <Space direction="vertical" style={{ width: "100%" }}>
            <Space wrap={true} direction="horizontal">
                <Button
                    icon={reset ? <UpdateLink /> : <LockReset />}
                    title={msgUpdate.join("\n")}
                    className="button-share"
                    onClick={handleClickUpdate}
                    color={reset ? "defaut" : "primary"} variant="text"
                    disabled={!resetExtent}
                >
                    {reset ? gettext("Обновить текущий адрес страницы") : gettext("Сбросить текущий адрес страницы")}
                </Button>
                <Button
                    icon={<ContentCopy />}
                    title={gettext("Копировать текущий адрес")}
                    className="button-share"
                    onClick={(e) => handleClickCopy(e, "popup")}
                    color="defaut" variant="text"
                />
            </Space>
            <Space wrap={true} direction="horizontal">
                <Button
                    icon={<Fullscreen />}
                    title={msgUpdate.join("\n")}
                    className="button-share"
                    onClick={handleClickUpdateExtent}
                    color={resetExtent ? "defaut" : "primary"} variant="text"
                    disabled={!reset}
                >
                    {resetExtent ? gettext("Применить текущий охват карты") : gettext("Сбросить текущий адрес страницы")}
                </Button>
                <Button
                    icon={<ContentCopy />}
                    title={gettext("Копировать текущий адрес")}
                    className="button-share"
                    onClick={(e) => handleClickCopy(e, "extent")}
                    color="defaut" variant="text"
                />
            </Space>
            <Button
                icon={<UrlIcon />}
                title={gettext("Ссылка на объект")}
                className="button-share"
                href={url}
                target="_blank"
                color="default" variant="text"
            >
                {gettext("Открыть ссылку в новом окне")}
            </Button>
        </Space >
    </>)
});
