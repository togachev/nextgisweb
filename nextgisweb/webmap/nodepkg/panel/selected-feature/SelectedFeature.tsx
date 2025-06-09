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

import type SelectedFeatureStore from "./SelectedFeatureStore"
import type { PanelPluginWidgetProps } from "../registry";

import "./SelectedFeature.less";

const ItemSelectValue = observer(({ display, store }) => {
    const { simulatePointZoom, visibleItems } = useSelected(display);

    const deleteRow = (key, id) => {
        display.imodule._visible({ hidden: true, overlay: undefined, key: "popup" })
        topic.publish("feature.unhighlight");
        display.imodule.iStore.setFullscreen(false)
        display.imodule.iStore.setValueRnd({ ...store.valueRnd, x: -9999, y: -9999 });

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
        const { title, layerId, styleId } = item[1].value;
        const { id, type, checked } = item[1];

        return Object.keys(item[1].items).length > 0 && (
            <div key={item[0]} className="row-selected">
                <div className="item-label"                >
                    <div title={title} className="label">
                        {title}
                    </div>
                    <Button type="text" icon={<ZoomInMapIcon />} onClick={() => {
                        display.imodule._visible({ hidden: true, overlay: undefined, key: "popup" })
                        display.imodule.iStore.setFullscreen(false)
                        display.imodule.iStore.setValueRnd({ ...store.valueRnd, x: -9999, y: -9999 });
                        type === "vector" ? display.imodule.zoomTo({ id, layerId }) :
                            type === "raster" ? display.imodule.zoomToRasterExtent({ styleId }) :
                                undefined;
                    }} />
                    {Object.keys(item[1].items).length > 0 && type === "raster" &&
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
                {
                    Object.keys(item[1].items).length > 0 &&
                    getEntries(item[1].items).map((item) => {
                        return (
                            <div key={item[0]} className="label-child-element">
                                <div className="label-child">{item[1].desc}</div>
                                <Button
                                    type="text"
                                    icon={<EyeOutline />}
                                    onClick={() => {
                                        simulatePointZoom(item);
                                        visibleItems(item);
                                    }}
                                />
                                <Button
                                    type="text"
                                    icon={<DeleteOutline />}
                                    onClick={() => deleteRow(key, item[0])}
                                />
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