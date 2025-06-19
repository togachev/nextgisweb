import { observer } from "mobx-react-lite";
import { useCallback, useEffect } from "react";
import { Alert, Button, Descriptions, Popover } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import Close from "@nextgisweb/icon/mdi/close";
import CloseBoxOutline from "@nextgisweb/icon/mdi/close-box-outline";
import CloseBoxMultiple from "@nextgisweb/icon/mdi/close-box-multiple";
import PlaylistRemove from "@nextgisweb/icon/mdi/playlist-remove";
import Visibility from "@nextgisweb/icon/material/visibility";
import InformationOutline from "@nextgisweb/icon/mdi/information-variant-circle-outline";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { DescriptionsProps } from "@nextgisweb/gui/antd";
import type SelectedFeatureStore from "./SelectedFeatureStore"
import type { PanelPluginWidgetProps } from "../registry";
import { IModule } from "@nextgisweb/webmap/imodule";

import "./SelectedFeature.less";

const ItemSelectValue = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(
    ({ display, store }) => {
        const { visibleItems } = useSelected(display, store);
        const imodule: IModule = display.imodule;

        const deleteRow = ({ key, ckey, all }) => {
            imodule?.popup_destroy();
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

        useEffect(() => {
            const { lchecked, lckey } = store.activeLayer;
            if (store.countLayers > 0 && store.activeChecked.achecked === false) {
                if (lchecked) {
                    imodule?.zoomToLayerExtent({ styleId: Number(lckey) });
                    visibleItems({ value: [Number(lckey)] });
                } else {
                    imodule?.popup_destroy();
                    display._zoomToInitialExtent();
                    visibleItems({ value: undefined });
                }
            }
        }, [store.activeLayer]);

        useEffect(() => {
            const { achecked, ackey, acvalue } = store.activeChecked;
            if (store.countItems > 0 && store.activeLayer.lchecked === false) {
                if (achecked) {
                    if (acvalue.type === "vector") {
                        store.setSimulatePointZoom({ key: ackey, value: acvalue, type: "vector" });
                    } else if (acvalue.type === "raster") {
                        store.setSimulatePointZoom({ key: ackey, value: acvalue, type: "raster" });
                    }
                    visibleItems({ value: [acvalue.styleId] });
                } else {
                    imodule?.popup_destroy();
                    display._zoomToInitialExtent();
                    visibleItems({ value: undefined });
                }
            }
        }, [store.activeChecked]);

        const msgZoomToLayer = gettext("Zoom to layer");
        const msgValueRaster = gettext("Value raster layer");

        return getEntries(store.selectedFeatures).map(([key, value]) => {
            const { title, styleId } = value.value;

            const objLayer = { ...store.activeLayer };

            return Object.keys(value.items).length > 0 && (
                <div key={key} className="row-selected">
                    {store.visibleLayerName &&
                        <div className="item-label">
                            <Button
                                title={objLayer.lchecked ? [title, gettext("Initial extent")].join(" \n") : [title, msgZoomToLayer].join(" \n")}
                                className="label"
                                size="small"
                                type="text"
                                onClick={() => {
                                    if (objLayer.lckey !== key) {
                                        imodule?.zoomToLayerExtent({ styleId });
                                        visibleItems({ value: [styleId] });
                                        store.setActiveLayer({ lchecked: true, lckey: key, })
                                    } else {
                                        store.setActiveLayer({ lchecked: !objLayer.lchecked, lckey: key })
                                    }
                                    store.setActiveChecked({
                                        ...store.activeChecked,
                                        achecked: false,
                                    });
                                }}
                                color={objLayer.lchecked && objLayer.lckey === key && "primary"}
                                variant="filled"
                            >
                                {title}
                            </Button>
                            <div className="control-item">
                                <Button
                                    title={gettext("Clear selection of objects from current layer")}
                                    type="text"
                                    size="small"
                                    icon={<CloseBoxOutline />}
                                    onClick={() => {
                                        deleteRow({ key: key, ckey: null, all: true })
                                        imodule?.popup_destroy();
                                        display._zoomToInitialExtent();
                                        visibleItems({ value: undefined });
                                    }}
                                />
                            </div>
                        </div>
                    }
                    {
                        Object.keys(value.items).length > 0 &&
                        getEntries(value.items).map(([ckey, cvalue], index) => {
                            const id = index + 1;
                            const obj = { ...store.activeChecked };
                            return (
                                <div key={ckey} className="label-child-element">
                                    <Button
                                        title={obj.achecked ? gettext("Initial extent") : gettext("View information about the object")}
                                        onClick={() => {
                                            if (obj.ackey !== ckey) {
                                                if (cvalue.type === "vector") {
                                                    store.setSimulatePointZoom({ key: ckey, value: cvalue, type: "vector" });
                                                } else if (cvalue.type === "raster") {
                                                    store.setSimulatePointZoom({ key: ckey, value: cvalue, type: "raster" });
                                                }
                                                visibleItems({ value: [cvalue.styleId] });
                                                store.setActiveChecked({ achecked: true, ackey: ckey, acvalue: cvalue })
                                            } else {
                                                store.setActiveChecked({ achecked: !obj.achecked, ackey: ckey, acvalue: cvalue })
                                            }
                                            store.setActiveLayer({
                                                ...store.activeLayer,
                                                lchecked: false,
                                            });
                                        }}
                                        className="label-child"
                                        type="text"
                                        size="small"
                                        color={obj.achecked && obj.ackey === ckey && "primary"}
                                        variant="filled"
                                    >
                                        {cvalue.type === "vector" ? cvalue.label : `${id}. ${msgValueRaster}`}
                                    </Button>
                                    <div className="control-item">
                                        <Button
                                            title={gettext("Delete selected feature")}
                                            type="text"
                                            size="small"
                                            icon={<Close />}
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

const InfoSelect = () => {
    const items: DescriptionsProps["items"] = [
        {
            key: "1",
            label: <div className="icon-description"><Visibility /></div>,
            children: gettext("Turn layers on/off by default when viewing object information.")
        },
        {
            key: "2",
            label: <div className="icon-description"><PlaylistRemove /></div>,
            children: gettext("Hide layer names.")
        },
        {
            key: "3",
            label: <div className="icon-description"><CloseBoxMultiple /></div>,
            children: gettext("Delete all selected objects.")
        },
        {
            key: "4",
            label: <div className="icon-description"><CloseBoxOutline /></div>,
            children: gettext("Delete a portion of the selected objects for each layer.")
        },
        {
            key: "5",
            label: <div className="icon-description"><Close /></div>,
            children: gettext("Delete a single object.")
        },
    ];

    return (
        <Descriptions
            styles={{ content: { padding: "5px" } }}
            bordered
            size="small"
            column={1}
            layout="horizontal"
            items={items}
        />
    );
};

const SelectedFeature = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(
    ({ display, store }) => {
        const { visibleItems } = useSelected(display, store);
        const imodule: IModule = display.imodule;

        const onCheckedVisibleItems = useCallback(() => {
            store.setChecked(!store.checked);
            if (store.checked === false) {
                imodule?.popup_destroy();
                visibleItems({ value: undefined });
                display._zoomToInitialExtent();
            }
        }, []);

        const onVisibleLayerName = useCallback(() => {
            store.setVisibleLayerName(!store.visibleLayerName);
        }, []);

        const deleteAllRow = () => {
            imodule?.popup_destroy();
            const newObject = { ...store.selectedFeatures };
            getEntries(newObject).map(([_, value]) => value.items = {});
            store.setSelectedFeatures(newObject);
            display._zoomToInitialExtent();
            visibleItems({ value: undefined });
        };

        const msgDefaultVisibleLayer = store.checked ? gettext("Turn on default layers visibility") : gettext("Turn off inactive layers");
        const msgFunction = gettext("Button functions:");
        const msgDescription = gettext("Description");
        const msgSelectFeature = gettext("History of selection of objects of vector and raster layers of the web map");
        const msgVisibleLayerName = store.visibleLayerName ? gettext("Hide layer name") : gettext("Show layer name");

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
                {store.countItems === 0 && <Alert
                    message={msgSelectFeature}
                    banner
                    showIcon={false}
                />}
                <div className="control-visible">
                    <div className="control-item">
                        <Button
                            title={msgDefaultVisibleLayer}
                            type="text"
                            size="small"
                            icon={<Visibility />}
                            onClick={onCheckedVisibleItems}
                            color={store.checked && "primary"}
                            variant="filled"
                            disabled={store.countItems === 0}
                        />
                        <Button
                            title={msgVisibleLayerName}
                            type="text"
                            size="small"
                            icon={<PlaylistRemove />}
                            onClick={onVisibleLayerName}
                            color={!store.visibleLayerName && "primary"}
                            variant="filled"
                            disabled={store.countItems === 0}
                        />
                        <Popover overlayClassName="popover-class" content={<InfoSelect count={store.countItems} />} title={msgFunction} trigger="click">
                            <Button
                                title={msgDescription}
                                type="text"
                                size="small"
                                icon={<InformationOutline />}
                            />
                        </Popover>
                    </div>
                    <div className="control-item">
                        <Button
                            title={gettext("Clear all selected feature")}
                            type="text"
                            size="small"
                            icon={<CloseBoxMultiple />}
                            onClick={deleteAllRow}
                            disabled={store.countItems === 0}
                        />
                    </div>
                </div>
                <ItemSelectValue {...{ display, store }} />
            </PanelContainer>
        )
    }
);

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;