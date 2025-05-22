import { useState, useEffect } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { observer } from "mobx-react-lite";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Button, Input, Space } from "@nextgisweb/gui/antd";
import { getPermalink } from "@nextgisweb/webmap/utils/permalink";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import ContentSaveOutline from "@nextgisweb/icon/mdi/content-save-outline";
import UrlIcon from "@nextgisweb/icon/mdi/link";
import Fullscreen from "@nextgisweb/icon/mdi/fullscreen";

import "./ShareFeature.less"

import type { ContentProps } from "../type";

const { TextArea } = Input;

const msgUpdate = [
    gettext("Update web map url."),
    gettext("Double click will return the original page address."),
];

export const ShareFeature = observer((props) => {

    const { display, store } = props as ContentProps;
    const { copyValue, contextHolder } = useCopy();

    const [editUrl, setEditUrl] = useState(true);
    const [url, setUrl] = useState(store.contextUrl);
    const [reset, setReset] = useState(true);
    const [resetExtent, setResetExtent] = useState(true);

    const handleClickUpdate = () => {
        setReset(!reset);
    };

    const handleClickUpdateExtent = () => {
        setResetExtent(!resetExtent);
    };

    useEffect(() => {
        editUrl && setUrl(decodeURIComponent(url))
    }, [])

    const changeUrl = () => {
        !editUrl ? setEditUrl(true) : store.contextUrl !== url ? resetUrl() : setEditUrl(false)
    };

    const onChangeUrl = (e) => {
        setUrl(decodeURIComponent(e.target.value));
    };

    const resetUrl = () => {
        store.generateUrl({ res: store.selected, st: store.data, pn: store.fixPanel, disable: false });
        setUrl(store.contextUrl);
    };

    const msgEditUrl = !editUrl ? gettext("Сохранить ссылку") : store.contextUrl !== url ? gettext("Сбросить ссылку") : gettext("Изменить сылку");

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

            <Button
                icon={reset ? <UpdateLink /> : <LockReset />}
                title={msgUpdate.join("\n")}
                className="button-share"
                onClick={handleClickUpdate}
                size="small"
                color={reset ? "defaut" : "primary"} variant="outlined"
                disabled={!resetExtent}
            >
                {reset ? gettext("Обновить текущий адрес страницы") : gettext("Сбросить текущий адрес страницы")}
            </Button>
            <Button
                icon={<Fullscreen />}
                title={msgUpdate.join("\n")}
                className="button-share"
                onClick={handleClickUpdateExtent}
                size="small"
                color={resetExtent ? "defaut" : "primary"} variant="outlined"
                disabled={!reset}
            >
                {resetExtent ? gettext("Применить текущий охват карты") : gettext("Сбросить текущий адрес страницы")}
            </Button>
            <Space className="edit-url" direction="horizontal">
                <Button
                    icon={<UrlIcon />}
                    title={gettext("Ссылка на объект")}
                    className="button-share"
                    href={url}
                    target="_blank"
                    size="small"
                >
                    {gettext("Открыть ссылку в новом окне")}
                </Button>
                <Button
                    icon={
                        !editUrl ?
                            <ContentSaveOutline /> :
                            store.contextUrl !== url ? <LockReset /> :
                                <LinkEdit />
                    }
                    title={msgEditUrl}
                    className="button-share"
                    onClick={changeUrl}
                    size="small"
                >
                    {msgEditUrl}
                </Button>
            </Space>

            {!editUrl ?
                < TextArea
                    style={{ wordBreak: "break-all", overflow: "hidden" }}
                    autoSize
                    value={url}
                    onChange={onChangeUrl}
                /> :
                <code
                    className="code-url"
                    title={gettext("Нажмите, чтобы скопировать")}
                    onClick={() => {
                        copyValue(url, gettext("Object reference copied"))
                    }}
                >
                    {url}
                </code>}
        </Space >
    </>)
});
