import { useEffect, useState } from "react";
import { Button, message, Tooltip } from "@nextgisweb/gui/antd";
import type { ButtonProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { DojoDisplay } from "@nextgisweb/webmap/type";
import { getPermalink } from "@nextgisweb/webmap/utils/permalink";
import { routeURL } from "@nextgisweb/pyramid/api";

interface UpdateMapUrlProps extends ButtonProps {
    children?: React.ReactNode;
    iconOnly?: boolean;
    messageUpdateValue?: string;
    messageResetValue?: string;
    setUrlValue: () => string;
    resetUrlValue: () => string;
    icon?: React.ReactNode;
    display: DojoDisplay;
    mapLink: string;
}

const msgResetCurrentValue = gettext("Double click will return to original value")
const msgUpdateCurrentValue = gettext("Click to update current map address")

export const UpdateMapUrl = ({
    children,
    messageUpdateValue,
    messageResetValue,
    setUrlValue,
    resetUrlValue,
    iconOnly,
    icon,
    display,
    mapLink,
}: UpdateMapUrlProps) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [statusUrl, setStatusUrl] = useState(false);
    const [link, setLink] = useState();

    const webmapId = display.config.webmapId;

    const wlh = window.location.href.replace("panel=share", "")
    const currentUrl = ["?", "&"].includes(wlh.slice(-1)) ? wlh.slice(0, -1) : wlh;
    const popupContext = !currentUrl.includes("attribute");
    const panelUrl = ngwConfig.applicationUrl + routeURL("webmap.display", webmapId);

    const [messageApi, contextHolder] = message.useMessage();
    const messageInfo = (text) => {
        messageApi.open({
            type: "success",
            content: text,
            duration: 2,
        });
    };

    useEffect(() => {
        display.getVisibleItems().then((visibleItems) => {
            const permalink = getPermalink(display, visibleItems);
            setLink(decodeURIComponent(permalink));
        });
    }, [mapLink]);

    const valueSet = async () => {
        await navigator.clipboard.writeText(setUrlValue())
        messageInfo(messageUpdateValue || gettext("Value set"));
        setStatusUrl(true);
        setShowTooltip(false);
    };

    const resetValue = async () => {
        await navigator.clipboard.writeText(resetUrlValue());
        messageInfo(messageResetValue || gettext("Reset current value"));
        setStatusUrl(false);
    };

    let buttonContent: React.ReactNode | null = null;
    if (!iconOnly) {
        buttonContent = children || gettext("Set value");
    }

    useEffect(() => {
        link + "&panel=share" === currentUrl ? setStatusUrl(true) : setStatusUrl(false)
    }, [link]);

    const colorButton = link === currentUrl ? "primary" :
        currentUrl !== panelUrl && popupContext ? "orange" :
            "default"
    const variantButton = link === currentUrl ? "solid" :
        currentUrl !== panelUrl && popupContext ? "solid" :
            "outlined"

    return (
        <>
            {contextHolder}
            <Tooltip
                open={showTooltip}
                onOpenChange={setShowTooltip}
                title={statusUrl ? [msgUpdateCurrentValue, msgResetCurrentValue].join(' or \n') : msgUpdateCurrentValue}
            >
                <Button
                    color={colorButton}
                    variant={variantButton}
                    icon={icon}
                    onClick={(e) => {
                        if (e.detail === 1) {
                            valueSet();
                        } else if (e.detail === 2) {
                            resetValue();
                        }
                    }}
                >
                    {buttonContent}
                </Button>
            </Tooltip>
        </>
    );
};