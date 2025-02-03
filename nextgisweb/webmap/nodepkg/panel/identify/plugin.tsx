/** @plugin */

import { gettext } from "@nextgisweb/pyramid/i18n";
import { panelRegistry } from "@nextgisweb/webmap/panel/registry";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import IdentifyIcon from "@nextgisweb/icon/material/arrow_selector_tool";

panelRegistry(COMP_ID, {
    widget: () => import("./IdentifyPanel"),
    store: () => import("./IdentifyStore"),
    name: "identify",
    title: gettext("Identify"),
    icon: <IdentifyIcon />,
    order: 15,
    applyToTinyMap: true,

    isEnabled: () => {
        return !webmapSettings.identify_module;
    },
});
