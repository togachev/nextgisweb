/** @plugin */

import { gettext } from "@nextgisweb/pyramid/i18n";
import { panelRegistry } from "@nextgisweb/webmap/panel/registry";

import UploadFileIcon from "@nextgisweb/icon/material/upload_file";

panelRegistry(COMP_ID, {
    widget: () => import("./CustomLayer"),
    name: "custom-layer",
    title: gettext("Custom layers"),
    icon: <UploadFileIcon />,
    order: 80,
    applyToTinyMap: false,
});
