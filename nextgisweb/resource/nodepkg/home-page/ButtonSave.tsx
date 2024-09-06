import { Button } from "@nextgisweb/gui/antd";
import Edit from "@nextgisweb/icon/material/edit";
import Save from "@nextgisweb/icon/material/save";
import { gettext } from "@nextgisweb/pyramid/i18n";

const editPosition = gettext("Изменить");
const savePosition = gettext("Сохранить изменения");

export const ButtonSave = (props) => {
    const { onClickSave, staticPosition } = props;

    return (
        <span title={staticPosition ? editPosition : savePosition}>
            <Button
                icon={staticPosition ? <Edit /> : <Save />}
                size="small"
                onClick={onClickSave}
            />
        </span>
    );
}