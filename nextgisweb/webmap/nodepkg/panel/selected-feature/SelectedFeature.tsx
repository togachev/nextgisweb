import { observer } from "mobx-react-lite";
import { Button } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import CloseBoxOutline from "@nextgisweb/icon/mdi/close-box";
import CloseBoxMultipleOutline from "@nextgisweb/icon/mdi/close-box-multiple";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type SelectedFeatureStore from "./SelectedFeatureStore"
import type { PanelPluginWidgetProps } from "../registry";
import { IModule } from "@nextgisweb/webmap/imodule";

import "./SelectedFeature.less";

const ItemSelectValue = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(({ display, store }) => {
    const { simulatePointZoom, visibleItems } = useSelected(display);
    const imodule: IModule = display.imodule;

    const deleteRow = ({ key, ckey, all }) => {
        imodule.popup_destroy();
        if (all) {
            const newObject = { ...store.selectedFeatures };
            newObject[key].items = {};
            store.setSelectedFeatures(newObject);
        } else {
            const newObject = { ...store.selectedFeatures };
            delete newObject[key].items[ckey];
            store.setSelectedFeatures(newObject);
        }
    };

    return getEntries(store.selectedFeatures).map(([key, value]) => {
        const { title, styleId } = value.value;
        const visibleReset = { value: null, status: true };
        const visibleValue = { value: { styles: [styleId] }, status: false };
        return Object.keys(value.items).length > 0 && (
            <div key={key} className="row-selected">
                <div className="item-label">
                    <Button
                        title={gettext("Zoom to layer")}
                        className="label"
                        size="small"
                        type="text"
                        onClick={() => {
                            imodule.popup_destroy();
                            imodule.zoomToLayerExtent({ styleId });
                            visibleItems(visibleValue);
                        }}>
                        {title}
                    </Button>
                    <div className="control-item">
                        <Button
                            icon={<LockReset />}
                            title={gettext("Reset layers visibility")}
                            size="small"
                            type="text"
                            onClick={() => {
                                imodule.popup_destroy();
                                display._zoomToInitialExtent();
                                visibleItems(visibleReset);
                            }} />
                        <Button
                            title={gettext("Delete selected all features")}
                            type="text"
                            size="small"
                            icon={<CloseBoxMultipleOutline />}
                            onClick={() => deleteRow({ key: key, ckey: null, all: true })}
                        />
                    </div>
                </div>
                {
                    Object.keys(value.items).length > 0 &&
                    getEntries(value.items).map(([ckey, cvalue], index) => {
                        const id = index + 1;
                        const cVisibleValue = { value: { styles: [cvalue.styleId] }, status: false };
                        return (
                            <div key={ckey} className="label-child-element">
                                <Button
                                    title={gettext("View information about the object")}
                                    onClick={() => {
                                        if (cvalue.type === "vector") {
                                            simulatePointZoom({ key: ckey, value: cvalue, type: "vector" });
                                        } else if (cvalue.type === "raster") {
                                            simulatePointZoom({ key: ckey, value: cvalue, type: "raster" });
                                        }
                                        visibleItems(cVisibleValue);
                                    }}
                                    className="label-child"
                                    type="text"
                                    size="small"
                                >
                                    {cvalue.type === "vector" ? cvalue.label : `${id}. ${gettext("value raster")}`}
                                </Button>
                                <div className="control-item">
                                    <Button
                                        title={gettext("Delete selected feature")}
                                        type="text"
                                        size="small"
                                        icon={<CloseBoxOutline />}
                                        onClick={() => deleteRow({ key: key, ckey: ckey, all: false })}
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