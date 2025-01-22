import { Button, message } from "@nextgisweb/gui/antd";
import type { ButtonProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

interface SetValueButtonProps extends ButtonProps {
    children?: React.ReactNode;
    iconOnly?: boolean;
    messageInfo?: string;
    getTextToValue: () => string;
    icon?: React.ReactNode;
}

export function SetValueButton({
    children,
    messageInfo,
    getTextToValue,
    iconOnly,
    icon,
    ...restParams
}: SetValueButtonProps) {
    const valueSet = async () => {
        await navigator.clipboard.writeText(getTextToValue());
        message.info(messageInfo || gettext("Value set"));
    };

    let buttonContent: React.ReactNode | null = null;
    if (!iconOnly) {
        buttonContent = children || gettext("Set value");
    }

    return (
        <Button
            icon={icon}
            onClick={() => {
                valueSet();
            }}
            {...restParams}
        >
            {buttonContent}
        </Button>
    );
}
