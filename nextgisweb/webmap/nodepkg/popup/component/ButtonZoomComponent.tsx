import { gettext } from "@nextgisweb/pyramid/i18n";
import ZoomInMapIcon from "@nextgisweb/icon/material/zoom_in_map/outline";
import { Button } from "@nextgisweb/gui/antd";
import topic from "@nextgisweb/webmap/compat/topic";

import type { HighlightEvent } from "@nextgisweb/webmap/feature-highlighter/FeatureHighlighter";
import type { ContentProps } from "../type";

export const ButtonZoomComponent = ({ store }: ContentProps) => {

    return store.fixPos === null && store.response.featureCount > 0 && (
        <Button
            title={store.selected?.type === "vector" ? gettext("Zoom to feature") : gettext("Zoom to raster layer pixel")}
            type="text"
            size={store.size}
            onClick={() => {
                store.setValueRnd({ ...store.valueRnd, width: store.pos.width, height: store.pos.height });
                topic.publish("unvisible.point");
                topic.publish("update.point", false);
                if (store.selected?.type === "vector") {
                    store.zoomTo(store.selected);
                } else if (store.selected?.type === "raster") {
                    store.zoomToPoint(store.pointPopupClick.coordinate);
                    const highlightEvent: HighlightEvent = {
                        coordinates: store.pointPopupClick.coordinate,
                        colorsSelectedFeature: store.display.config.colorsSelectedFeature,
                    };
                    topic.publish("feature.highlight", highlightEvent);
                }
            }}
            icon={<ZoomInMapIcon />}
            style={{ flex: "0 0 auto" }}
            className="icon-symbol"
        />
    );
}