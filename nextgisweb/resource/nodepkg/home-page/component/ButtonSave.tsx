import { Button } from "@nextgisweb/gui/antd";
import Save from "@nextgisweb/icon/material/save";
import { gettext } from "@nextgisweb/pyramid/i18n";

const savePosition = gettext("Save changes");

export const ButtonSave = (props) => {
    const { onClickSave, staticPosition, icon, text, className, disabled } = props;

    return (
        <span title={staticPosition ? text : savePosition} className={className}>
            <Button
                disabled={disabled}
                size="small"
                icon={staticPosition ? icon : <Save />}
                onClick={onClickSave}
                type="text"
            />
        </span>
    );
}