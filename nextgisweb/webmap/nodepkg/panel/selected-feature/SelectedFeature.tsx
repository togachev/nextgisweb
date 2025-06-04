import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Button, Checkbox } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import CloseBoxOutline from "@nextgisweb/icon/mdi/close-box-outline";
import CloseBoxMultipleOutline from "@nextgisweb/icon/mdi/close-box-multiple";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type SelectedFeatureStore from "./SelectedFeatureStore"
import type { PanelPluginWidgetProps } from "../registry";
import { IModule } from "@nextgisweb/webmap/imodule";

import "./SelectedFeature.less";

const ItemSelectValue = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(({ display, store }) => {
    const { visibleItems } = useSelected(display, store);
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
        return Object.keys(value.items).length > 0 && (
            <div key={key} className="row-selected">
                <div className="item-label">
                    <Button
                        title={gettext("Zoom to layer")}
                        className="label"
                        size="small"
                        type="text"
                        onClick={() => {
                            imodule.zoomToLayerExtent({ styleId });
                            visibleItems({ value: [styleId] });
                        }}>
                        {title}
                    </Button>
                    <div className="control-item">
                        <Button
                            title={gettext("Delete selected all features")}
                            type="text"
                            size="small"
                            icon={<CloseBoxMultipleOutline />}
                            onClick={() => {
                                deleteRow({ key: key, ckey: null, all: true })
                                imodule.popup_destroy();
                                display._zoomToInitialExtent();
                                visibleItems({ value: undefined });
                            }}
                        />
                    </div>
                </div>
                {
                    Object.keys(value.items).length > 0 &&
                    getEntries(value.items).map(([ckey, cvalue], index) => {
                        const id = index + 1;
                        return (
                            <div key={ckey} className="label-child-element">
                                <Button
                                    title={gettext("View information about the object")}
                                    onClick={() => {
                                        store.setActiveKey(ckey);
                                        if (cvalue.type === "vector") {
                                            store.setSimulatePointZoom({ key: ckey, value: cvalue, type: "vector" });
                                        } else if (cvalue.type === "raster") {
                                            store.setSimulatePointZoom({ key: ckey, value: cvalue, type: "raster" });
                                        }
                                        visibleItems({ value: [cvalue.styleId] });
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
    ({ display, store }) => {
        const { visibleItems } = useSelected(display, store);

        const onCheckedVisibleItems = useCallback((e) => {
            store.setChecked(e.target.checked);
            if (e.target.checked === false) {
                display.imodule.popup_destroy();
                visibleItems({ value: undefined });
                display._zoomToInitialExtent();
            }
        }, []);

        const defaultVisibleLayer = store.checked ? gettext("Turn on default layers visibility") : gettext("Turn off inactive layers");

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
                <div className="control-visible">
                    <Checkbox checked={store.checked} onChange={onCheckedVisibleItems}>
                        {defaultVisibleLayer}
                    </Checkbox>
                </div>
                <ItemSelectValue {...{ display, store }} />
            </PanelContainer>
        )
    }
);

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;