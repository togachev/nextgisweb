import { Button, Dropdown } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import DotsVertical from "@nextgisweb/icon/mdi/dots-vertical";
import ZoomInMapIcon from "@nextgisweb/icon/material/zoom_in_map/outline";

export function LayersDropdown({ onClick }) {
    const menuItems = [
        {
            key: "zoomToAllLayers",
            icon: <ZoomInMapIcon />,
            label: gettext("Zoom to all layers"),
        },
    ];

    const menuProps = {
        items: menuItems,
        onClick: (clickRcMenuItem) => {
            const { key } = clickRcMenuItem;
            onClick(key);
        },
    };

    return (
        <Dropdown
            menu={menuProps}
            trigger={["click"]}
            destroyPopupOnHide
            placement="bottomRight"
        >
            <Button type="text" shape="circle" icon={<DotsVertical />} />
        </Dropdown>
    );
}
