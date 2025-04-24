import { Button } from "@nextgisweb/gui/antd";
import Edit from "@nextgisweb/icon/material/edit";
import Save from "@nextgisweb/icon/material/save";
import { gettext } from "@nextgisweb/pyramid/i18n";

const editPosition = gettext("Edit");
const savePosition = gettext("Save changes");

export const ButtonSave = (props) => {
    const { onClickSave, staticPosition } = props;

    return (
        <span title={staticPosition ? editPosition : savePosition} >
            <Button
                className="button-edit-save"
                icon={staticPosition ? <Edit /> : <Save />}
                onClick={onClickSave}
                type="default"
            />
        </span>
    );
}