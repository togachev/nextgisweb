import { observer } from "mobx-react-lite";
import { Button } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import DeleteOutline from "@nextgisweb/icon/mdi/delete-outline";
import SelectionMultipleMarker from "@nextgisweb/icon/mdi/selection-multiple-marker";
import EyeOutline from "@nextgisweb/icon/mdi/eye-outline";
import ZoomInMapIcon from "@nextgisweb/icon/material/zoom_in_map/outline";
import topic from "@nextgisweb/webmap/compat/topic";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { HighlightEvent } from "@nextgisweb/webmap/feature-highlighter/FeatureHighlighter";
import type SelectedFeatureStore from "./SelectedFeatureStore"
import type { PanelPluginWidgetProps } from "../registry";

import "./SelectedFeature.less";

const ItemSelectValue = observer(({ display, store }) => {
    const { simulatePointZoom, visibleItems } = useSelected(display);

    const deleteRow = (key, id) => {
        display.imodule.popup_destroy();
        const newObject = { ...store.selectedFeatures };
        delete newObject[key].items[id];
        store.setSelectedFeatures(newObject);
    };

    const onChange = (key) => {
        store.setSelectedFeatures({
            ...store.selectedFeatures,
            [key]: {
                ...store.selectedFeatures[key],
                ...{
                    checked: !store.selectedFeatures[key].checked,
                }
            }
        })
    }

    return getEntries(store.selectedFeatures).map((item) => {
        const key = item[0];
        const { title, styleId } = item[1].value;
        const { checked } = item[1];

        return Object.keys(item[1].items).length > 0 && (
            <div key={item[0]} className="row-selected">
                <div className="item-label">
                    <div title={title} className="label">
                        {title}
                    </div>
                    <div className="control-item">
                        <Button type="text" icon={<ZoomInMapIcon />} onClick={() => {
                            display.imodule.popup_destroy();
                            display.imodule.zoomToLayerExtent({ styleId });
                        }} />
                        {Object.keys(item[1].items).length > 0 &&
                            <Button
                                type="text"
                                icon={<SelectionMultipleMarker />}
                                title={gettext("Pixel selection mode on one raster layer")}
                                onClick={() => { onChange(key) }}
                                color={checked && "primary"}
                                variant="outlined"
                            />
                        }
                    </div>
                </div>
                {
                    Object.keys(item[1].items).length > 0 &&
                    getEntries(item[1].items).map((item) => {
                        return (
                            <div key={item[0]} className="label-child-element">
                                <div
                                    onClick={() => {
                                        if (item[1].type === "vector") {
                                            simulatePointZoom({ item: item, type: "vector" });
                                        } else if (item[1].type === "raster") {
                                            simulatePointZoom({ item: item, type: "raster" });
                                        }
                                        visibleItems(item);
                                    }}
                                    className="label-child">{item[1].label}
                                </div>
                                <div className="control-item">
                                    {/* <Button type="text" icon={<ZoomInMapIcon />} onClick={() => {
                                        topic.publish("unvisible.point");
                                        topic.publish("update.point", true);
                                        if (item[1].type === "vector") {
                                            display.imodule.zoomTo(item[1])
                                        } else if (item[1].type === "raster") {
                                            display.imodule.zoomToPoint(item[1].coordinate);
                                            const highlightEvent: HighlightEvent = {
                                                coordinates: item[1].coordinate,
                                            };
                                            topic.publish("feature.highlight", highlightEvent);
                                        }
                                    }} /> */}
                                    <Button
                                        type="text"
                                        icon={<DeleteOutline />}
                                        onClick={() => deleteRow(key, item[0])}
                                    />
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        )
    })
});


const SelectedFeature = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(
    ({ display, store }) => {
        return (
            <PanelContainer
                className="ngw-webmap-selected-feature-panel"
                title={store.title}
                close={store.close}
                components={{
                    content: PanelContainer.Unpadded,
                    epilog: PanelContainer.Unpadded,
                }}
            >
                <ItemSelectValue display={display} store={store} />
            </PanelContainer>
        );
    });

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;