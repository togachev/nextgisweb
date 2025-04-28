import { Button } from "@nextgisweb/gui/antd";
import Save from "@nextgisweb/icon/material/save";
import { gettext } from "@nextgisweb/pyramid/i18n";

const savePosition = gettext("Save changes");

export const ButtonSave = (props) => {
    const { onClickSave, staticPosition, icon, text } = props;

    return (
        <span title={staticPosition ? text : savePosition} >
            <Button
                className="button-edit-save"
                icon={staticPosition ? icon : <Save />}
                onClick={onClickSave}
                type="text"
            />
        </span>
    );
}