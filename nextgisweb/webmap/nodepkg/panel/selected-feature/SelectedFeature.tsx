import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Button, Checkbox } from "@nextgisweb/gui/antd";
import { filterObject, getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import DeleteOutline from "@nextgisweb/icon/mdi/delete-outline";
import EyeOutline from "@nextgisweb/icon/mdi/eye-outline";
import ZoomInMapIcon from "@nextgisweb/icon/material/zoom_in_map/outline";
import topic from "@nextgisweb/webmap/compat/topic";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { PanelPluginWidgetProps } from "../registry";
import type { DataProps } from "@nextgisweb/webmap/imodule/type";

import "./SelectedFeature.less";

const ItemSelectValue = ({ display, store }) => {
    const { simulatePointZoom, visibleItems } = useSelected(display);
    const deleteRow = (key) => {
        display.imodule._visible({ hidden: true, overlay: undefined, key: "popup" })
        topic.publish("feature.unhighlight");
        display.imodule.iStore.setFullscreen(false)
        display.imodule.iStore.setValueRnd({ ...store.valueRnd, x: -9999, y: -9999 });

        const newObject: DataProps = { ...store.multiSelected };
        delete newObject[key];
        store.setMultiSelected(newObject);
    };

    return getEntries(store.multiSelected).map((item) => {
        return (
            <div key={item[0]} className="row-selected">
                <div title={item[1].label} className="label-item">
                    {item[1].label}
                </div>
                <div className="control-item">
                    <Button type="text" icon={<DeleteOutline />} onClick={() => deleteRow(item[0])} />
                    <Button type="text" icon={<EyeOutline />} onClick={() => {
                        simulatePointZoom(item);
                        visibleItems(item);
                    }} />
                    <Button type="text" icon={<ZoomInMapIcon />} onClick={() => {
                        visibleItems(item);
                        item[1]?.type === "vector" ? display.imodule.zoomTo(item[1]) :
                            item[1]?.type === "raster" ? display.imodule.zoomToRasterExtent(item[1]) :
                                undefined;
                    }} />
                </div>
            </div>
        )
    })
}


const SelectedFeature = observer<PanelPluginWidgetProps>(
    ({ display, store }) => {
        console.log(store);
        
        const onChange = (e) => {
            store.setUniqueKey(e.target.checked);

            const newState = Object.assign({}, store.multiSelected);
            const rasterExists = getEntries(newState).some(([_, value]) => value.type === "raster");

            if (rasterExists) {
                getEntries(newState).map(([key, value]) => {
                    value.type === "raster" && delete newState[key];
                })
                store.setMultiSelected(newState);
            }
        }

        return (
            <PanelContainer
                className="ngw-webmap-custom-layer-panel"
                title={store.title}
                close={store.close}
                components={{
                    content: PanelContainer.Unpadded,
                    epilog: PanelContainer.Unpadded,
                }}
            >
                {store.rasterIncludes && <div className="mode-raster-select">
                    <Checkbox checked={store.uniqueKey} onChange={onChange}>
                        {gettext("Pixel selection mode on one raster layer")}
                    </Checkbox>
                </div>}
                {store.multiSelected &&
                    <ItemSelectValue display={display} store={store} />
                }
            </PanelContainer>
        );
    });

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;