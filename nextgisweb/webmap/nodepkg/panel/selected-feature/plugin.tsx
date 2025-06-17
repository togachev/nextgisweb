/** @plugin */

import { gettext } from "@nextgisweb/pyramid/i18n";
import { panelRegistry } from "@nextgisweb/webmap/panel/registry";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import FormatListBulleted from "@nextgisweb/icon/mdi/format-list-bulleted";
import type { DisplayConfig } from "@nextgisweb/webmap/type/api";

panelRegistry(COMP_ID, {
    widget: () => import("./SelectedFeature"),
    store: () => import("./SelectedFeatureStore"),
    name: "selected-feature",
    title: gettext("History of object selection"),
    icon: <FormatListBulleted />,
    order: 11,
    applyToTinyMap: false,

    isEnabled: ({ config }: { config: DisplayConfig }) => {
        return webmapSettings.imodule && config.selectFeaturePanel;
    },
});