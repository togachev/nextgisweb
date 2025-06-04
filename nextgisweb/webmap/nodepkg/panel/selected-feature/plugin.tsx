/** @plugin */

import { gettext } from "@nextgisweb/pyramid/i18n";
import { panelRegistry } from "@nextgisweb/webmap/panel/registry";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import FormatListBulleted from "@nextgisweb/icon/mdi/format-list-bulleted";

panelRegistry(COMP_ID, {
    widget: () => import("./SelectedFeature"),
    store: () => import("./SelectedFeatureStore"),
    name: "selected-feature",
    title: gettext("List of selected feature"),
    icon: <FormatListBulleted />,
    order: 11,
    applyToTinyMap: false,

    isEnabled: () => {
        return webmapSettings.imodule;
    },
});