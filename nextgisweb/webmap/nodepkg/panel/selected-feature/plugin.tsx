/** @plugin */

import { gettext } from "@nextgisweb/pyramid/i18n";
import { panelRegistry } from "@nextgisweb/webmap/panel/registry";
import settings from "@nextgisweb/webmap/client-settings";
import FormatListBulleted from "@nextgisweb/icon/mdi/format-list-bulleted";
import { isMobile as isM } from "@nextgisweb/webmap/mobile/selectors";

import type { DisplayConfig } from "@nextgisweb/webmap/type/api";

panelRegistry(COMP_ID, {
    widget: () => import("./SelectedFeature"),
    store: () => import("./SelectedFeatureStore"),
    name: "selected-feature",
    title: gettext("Browsing history"),
    icon: <FormatListBulleted />,
    order: 11,
    applyToTinyMap: false,

    isEnabled: ({ config }: { config: DisplayConfig }) => {
        return settings.imodule && config.selectFeaturePanel && !isM;
    },
});