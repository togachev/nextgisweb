import { useEffect, useState } from "react";
import { Button, message, Tooltip } from "@nextgisweb/gui/antd";
import type { ButtonProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

interface UpdateMapUrlProps extends ButtonProps {
    children?: React.ReactNode;
    iconOnly?: boolean;
    messageUpdateValue?: string;
    messageResetValue?: string;
    setUrlValue: () => string;
    resetUrlValue: () => string;
    icon?: React.ReactNode;
    mapLink: string;
    panel: string;
}

const msgResetCurrentValue = gettext("Double click will return to original value")
const msgUpdateCurrentValue = gettext("Click to update current map address")

export function UpdateMapUrl({
    children,
    messageUpdateValue,
    messageResetValue,
    setUrlValue,
    resetUrlValue,
    iconOnly,
    icon,
    mapLink,
    panel,
}: UpdateMapUrlProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [statusUrl, setStatusUrl] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");

    const link = mapLink + "&panel=" + panel;

    const [messageApi, contextHolder] = message.useMessage();
    const messageInfo = (text) => {
        messageApi.open({
            type: "success",
            content: text,
            duration: 2,
        });
    };

    const valueSet = async () => {
        await navigator.clipboard.writeText(setUrlValue())
        messageInfo(messageUpdateValue || gettext("Value set"));
        setStatusUrl(true);
        setShowTooltip(false);
        setCurrentUrl(mapLink)
    };

    const resetValue = async () => {
        await navigator.clipboard.writeText(resetUrlValue());
        messageInfo(messageResetValue || gettext("Reset current value"));
        setStatusUrl(false);
        setCurrentUrl("");
    };

    let buttonContent: React.ReactNode | null = null;
    if (!iconOnly) {
        buttonContent = children || gettext("Set value");
    }

    useEffect(() => {
        link === window.location.href ? setStatusUrl(true) : setStatusUrl(false)
    }, [link]);

    return (
        <>
            {contextHolder}
            <Tooltip
                open={showTooltip}
                onOpenChange={setShowTooltip}
                title={statusUrl && currentUrl ? msgResetCurrentValue : msgUpdateCurrentValue}
            >
                <Button
                    type={statusUrl ? "primary" : "default"}
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
}
