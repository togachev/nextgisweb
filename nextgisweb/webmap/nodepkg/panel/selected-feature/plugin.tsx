/** @plugin */

import { gettext } from "@nextgisweb/pyramid/i18n";
import { panelRegistry } from "@nextgisweb/webmap/panel/registry";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import ViewList from "@nextgisweb/icon/mdi/view-list";

panelRegistry(COMP_ID, {
    widget: () => import("./SelectedFeature"),
    store: () => import("./SelectedFeatureStore"),
    name: "selected-feature",
    title: gettext("List of selected feature"),
    icon: <ViewList />,
    order: 11,
    applyToTinyMap: false,

    isEnabled: () => {
        return webmapSettings.imodule;
    },
});