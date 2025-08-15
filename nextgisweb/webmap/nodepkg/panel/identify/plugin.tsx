/** @plugin */

import { gettext } from "@nextgisweb/pyramid/i18n";
import { panelRegistry } from "@nextgisweb/webmap/panel/registry";
import settings from "@nextgisweb/webmap/client-settings";
import IdentifyIcon from "@nextgisweb/icon/material/arrow_selector_tool";
import { isMobile as isM } from "@nextgisweb/webmap/mobile/selectors";

panelRegistry(COMP_ID, {
    widget: () => import("./IdentifyPanel"),
    store: () => import("./IdentifyStore"),
    name: "identify",
    title: gettext("Identify"),
    icon: <IdentifyIcon />,
    order: 15,
    applyToTinyMap: true,

    isEnabled: () => {
        return !settings.imodule || isM;
    },
});
