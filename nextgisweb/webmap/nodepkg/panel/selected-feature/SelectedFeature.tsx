import { observer } from "mobx-react-lite";
import { Button } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import DeleteOutline from "@nextgisweb/icon/mdi/delete-outline";
import ZoomInMapIcon from "@nextgisweb/icon/material/zoom_in_map/outline";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type SelectedFeatureStore from "./SelectedFeatureStore"
import type { PanelPluginWidgetProps } from "../registry";
import { IModule } from "@nextgisweb/webmap/imodule";

import "./SelectedFeature.less";

const ItemSelectValue = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(({ display, store }) => {
    const { simulatePointZoom, visibleItems } = useSelected(display);
    const imodule: IModule = display.imodule;

    const deleteRow = (key, id) => {
        imodule.popup_destroy();
        const newObject = { ...store.selectedFeatures };
        delete newObject[key].items[id];
        store.setSelectedFeatures(newObject);
    };

    return getEntries(store.selectedFeatures).map(([key, value]) => {
        const { title, styleId } = value.value;

        return Object.keys(value.items).length > 0 && (
            <div key={key} className="row-selected">
                <div className="item-label">
                    <div title={title} className="label">
                        {title}
                    </div>
                    <div className="control-item">
                        <Button size="small" type="text" icon={<ZoomInMapIcon />} onClick={() => {
                            imodule.popup_destroy();
                            imodule.zoomToLayerExtent({ styleId });
                        }} />
                    </div>
                </div>
                {
                    Object.keys(value.items).length > 0 &&
                    getEntries(value.items).map(([ckey, cvalue], index) => {
                        const id = index + 1;
                        return (
                            <div key={ckey} className="label-child-element">
                                <div
                                    onClick={() => {
                                        if (cvalue.type === "vector") {
                                            simulatePointZoom({ key: ckey, value: cvalue, type: "vector" });
                                        } else if (cvalue.type === "raster") {
                                            simulatePointZoom({ key: ckey, value: cvalue, type: "raster" });
                                        }
                                        visibleItems({ value: cvalue });
                                    }}
                                    className="label-child">
                                    {cvalue.type === "vector" ? cvalue.label : `${id}. ${gettext("value raster")}`}
                                </div>
                                <div className="control-item">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<DeleteOutline />}
                                        onClick={() => deleteRow(key, ckey)}
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


const SelectedFeature = observer<PanelPluginWidgetProps>(
    ({ display, store }) => (
        <PanelContainer
            className="ngw-webmap-selected-feature-panel"
            title={store.title}
            close={store.close}
            components={{
                content: PanelContainer.Unpadded,
                epilog: PanelContainer.Unpadded,
            }}
        >
            <ItemSelectValue {...{ display, store }} />
        </PanelContainer>
    )
);

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;