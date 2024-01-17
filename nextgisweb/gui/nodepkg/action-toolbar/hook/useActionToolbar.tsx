import { useCallback } from "react";

import { Button, Tooltip } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";

import type {
    ButtonProps,
    CreateButtonActionOptions,
    UseActionToolbarProps,
} from "../type";

export function useActionToolbar({
    size,
    isFit,
    props,
}: UseActionToolbarProps) {
    const createButtonAction = useCallback(
        ({
            icon,
            title,
            disabled,
            action,
            ...rest
        }: CreateButtonActionOptions) => {
            const btnAction: ButtonProps = { size, ...rest };
            if (action) {
                const onClick = () => {
                    action(props);
                };
                btnAction.onClick = onClick;
            }
            if (disabled) {
                btnAction.disabled =
                    typeof disabled === "function" ? disabled(props) : disabled;
            }

            btnAction.icon =
                typeof icon === "string" ? (
                    <SvgIcon icon={icon} fill="currentColor" />
                ) : (
                    icon
                );
            if (!isFit && icon) {
                return (
                    <Tooltip title={title}>
                        <Button {...btnAction} />
                    </Tooltip>
                );
            }

            return <Button {...btnAction}>{title}</Button>;
        },
        [props, size, isFit]
    );

    return { createButtonAction };
}
