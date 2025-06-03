import { gettext } from "@nextgisweb/pyramid/i18n";
import ZoomInMapIcon from "@nextgisweb/icon/material/zoom_in_map/outline";
import { Button } from "@nextgisweb/gui/antd";
import topic from "@nextgisweb/webmap/compat/topic";

import type { ContentProps } from "../type";

export const ButtonZoomComponent = ({ display, store }: ContentProps) => {
    const imodule = display.imodule;
    return store.countFeature > 0 && store.selected && (
        <Button
            title={store.selected?.type === "vector" ? gettext("Zoom to feature") : gettext("Zoom to raster layer")}
            type="text"
            size="small"
            onClick={() => {
                topic.publish("unvisible.point");
                store.selected?.type === "vector" ? imodule.zoomTo(store.selected) :
                    store.selected?.type === "raster" ? imodule.zoomToRasterExtent(store.selected) :
                        undefined;
            }}
            icon={<ZoomInMapIcon />}
            style={{ flex: "0 0 auto" }}
            className="icon-symbol"
        />
    );
}