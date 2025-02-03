import { useEffect, useState } from "react";
import { Button, message, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";

import type { Display } from "@nextgisweb/webmap/display";
import type { ButtonProps } from "@nextgisweb/gui/antd";

import UpdateIcon from "@nextgisweb/icon/material/update";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";

interface UpdateMapUrlProps extends ButtonProps {
    setUrl: () => any;
    resetUrl: () => any;
    display: Display;
    mapLink: string;
}

const msgOriginalAddress = gettext("Click to return to original map address");
const msgUpdateAddress = gettext("Click to update current map address");
const msgUpdateValue = gettext("The map link updated.")
const msgResetValue = gettext("The map link reset.")
const msgUpdateUrl = gettext("Update url");
const msgClearUrl = gettext("Clear url");

export const UpdateMapUrl = ({
    setUrl,
    resetUrl,
    display,
    mapLink,
}: UpdateMapUrlProps) => {
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [currentUrl, setCurrentUrl] = useState<string>();
    const [popupContext, setPopupContext] = useState<boolean>();

    const [messageApi, contextHolder] = message.useMessage();
    const messageInfo = (text) => {
        messageApi.open({
            type: "success",
            content: text,
            duration: 2,
        });
    };

    const webmapId = display.config.webmapId;
    const panelUrl = ngwConfig.applicationUrl + routeURL("webmap.display", webmapId);

    useEffect(() => {
        const wlh = window.location.href.replace("panel=share", "")
        if (["?", "&"].includes(wlh.slice(-1))) {
            setCurrentUrl(wlh.slice(0, -1))
        } else {
            setCurrentUrl(wlh)
        }
        setPopupContext(!window.location.href.includes("attribute"))
    }, [window.location.href, mapLink]);

    const valueSet = async () => {
        await navigator.clipboard.writeText(setUrl())
        messageInfo(msgUpdateValue || gettext("Value set"));
        setShowTooltip(false);
    };

    const resetValue = async () => {
        await navigator.clipboard.writeText(resetUrl());
        messageInfo(msgResetValue || gettext("Reset current value"));
        setCurrentUrl(panelUrl)
    };

    return (
        <>
            {contextHolder}
            <Tooltip
                open={showTooltip}
                onOpenChange={setShowTooltip}
                title={mapLink === currentUrl && popupContext ? msgOriginalAddress : currentUrl !== panelUrl && popupContext ? msgUpdateAddress : msgUpdateAddress}
            >
                {mapLink === currentUrl && popupContext ?
                    <Button
                        color="primary"
                        variant="solid"
                        onClick={resetValue}
                        icon={<DeleteForever />}
                    >
                        {msgClearUrl}
                    </Button> :
                    <Button
                        color={currentUrl !== panelUrl && popupContext ? "orange" : "default"}
                        variant={currentUrl !== panelUrl && popupContext ? "solid" : "outlined"}
                        onClick={valueSet}
                        icon={<UpdateIcon />}
                    >
                        {msgUpdateUrl}
                    </Button>
                }
            </Tooltip>
        </>
    );
};