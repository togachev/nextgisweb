import { fetchSettings } from "@nextgisweb/pyramid/settings";

import type { MapgroupConfig } from "./group-widget/type";

export interface MapgroupSettings {
    groups: MapgroupConfig[];
}

export default await fetchSettings<MapgroupSettings>(COMP_ID);
