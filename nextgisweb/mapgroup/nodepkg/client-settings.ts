import { fetchSettings } from "@nextgisweb/pyramid/settings";

import type { MapgroupConfig } from "./webmap-widget/type";

export interface MapgroupSettings {
    mapgroups: MapgroupConfig[];
}

export default await fetchSettings<MapgroupSettings>(COMP_ID);
