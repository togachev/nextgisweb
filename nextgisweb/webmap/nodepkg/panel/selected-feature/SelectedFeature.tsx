import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Alert, Button, Descriptions, Popover } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/popup/util/function";
import { PanelContainer } from "../component";
import { ButtonZoomComponent } from "@nextgisweb/webmap/popup/component/ButtonZoomComponent";
import Close from "@nextgisweb/icon/mdi/close";
import CloseBoxOutline from "@nextgisweb/icon/mdi/close-box-outline";
import CloseBoxMultiple from "@nextgisweb/icon/mdi/close-box-multiple";
import PlaylistRemove from "@nextgisweb/icon/mdi/playlist-remove";
import Visibility from "@nextgisweb/icon/mdi/cancel";
import InformationOutline from "@nextgisweb/icon/mdi/information-variant-circle-outline";
import CircleSmall from "@nextgisweb/icon/mdi/circle-small";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { DescriptionsProps } from "@nextgisweb/gui/antd";
import type SelectedFeatureStore from "./SelectedFeatureStore"
import type { PanelPluginWidgetProps } from "../registry";

import "./SelectedFeature.less";

const ItemSelectValue = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(
    ({ display, store }) => {
        const { visibleItems } = useSelected(display, store);
        const pstore = display.popupStore;

        const deleteRow = ({ key, ckey, all }) => {
            pstore?.pointDestroy();
            pstore?.setFixPopup(false);
            if (all) {
                const obj = { ...store.selectedFeatures };
                store.setSelectedFeatures({
                    ...obj,
                    [key]: {
                        ...obj[key],
                        items: {}
                    }
                });
            } else {
                const obj = { ...store.selectedFeatures };
                delete obj[key].items[ckey];
                store.setSelectedFeatures(obj);
            }
        };

        const lOnChecked = useCallback((key, styleId) => {
            if (store.activeLayer.lckey !== key) {
                pstore?.zoomToLayerExtent({ styleId });
                visibleItems({ value: [styleId] });
                store.setActiveLayer({ lchecked: true, lckey: key, })
            } else {
                store.setActiveLayer({ lchecked: !store.activeLayer.lchecked, lckey: key })
            }
            store.setActiveChecked({
                ...store.activeChecked,
                achecked: false,
            });

            const { lchecked } = store.activeLayer;
            if (store.countLayers > 0 && store.activeChecked.achecked === false) {
                if (lchecked) {
                    pstore?.zoomToLayerExtent({ styleId });
                    visibleItems({ value: [styleId] });
                    pstore?.pointDestroy();
                } else {
                    display.map.zoomToInitialExtent();
                    visibleItems({ value: undefined });
                }
            }
        }, [store.activeLayer]);

        const acOnChecked = useCallback((ckey, cvalue) => {
            if (store.activeChecked.ackey !== ckey) {
                store.setActiveChecked({ achecked: true, ackey: ckey, acvalue: cvalue })
            } else {
                store.setActiveChecked({ achecked: !store.activeChecked.achecked, ackey: ckey, acvalue: cvalue })
            }
            store.setActiveLayer({
                ...store.activeLayer,
                lchecked: false,
            });

            const { achecked, ackey, acvalue } = store.activeChecked;
            if (achecked) {
                if (acvalue.selected.type === "vector") {
                    store.setSimulatePointZoom({ key: ackey, value: acvalue, type: "vector" });
                } else if (acvalue.selected.type === "raster") {
                    store.setSimulatePointZoom({ key: ackey, value: acvalue, type: "raster" });
                }
                visibleItems({ value: [acvalue.selected.styleId] });
            } else {
                pstore?.pointDestroy();
                display.map.zoomToInitialExtent();
                visibleItems({ value: undefined });
            }
        }, [store.activeChecked])

        const msgZoomToLayer = gettext("Zoom to layer");
        const msgValueRaster = gettext("Value raster layer");

        const lOnCheckedVisibility = useCallback((styleId, visibility) => {
            const visibleStyles: number[] = display.treeStore.visibleStyleIds;
            visibleStyles.push(styleId)
            if (visibility === false && store.checked === false) {
                display.treeStore.setVisibleIdsUseStyles(visibleStyles);
            }
        }, [store.activeChecked]);

        return (<div>{
            getEntries(store.selectedFeatures).map(([key, value], lidx) => {
                const { title, styleId, layerHighligh, visibility } = value.value;
                const objLayer = { ...store.activeLayer };
                const lchecked = objLayer.lchecked && objLayer.lckey === key;

                return Object.keys(value.items).length > 0 && (
                    <div key={lidx} className="row-selected">
                        {store.visibleLayerName &&
                            <div className="label-child-element">
                                <Button
                                    title={objLayer.lchecked ? [title, gettext("Initial extent")].join(" \n") : [title, msgZoomToLayer].join(" \n")}
                                    className={lchecked ? "checked label-child" : !visibility ? "label-child label-child-color-not-visible" : "label-child"}
                                    size="small"
                                    type="text"
                                    onClick={() => {
                                        lOnChecked(key, styleId);
                                        lOnCheckedVisibility(styleId, visibility);
                                    }}
                                    color={objLayer.lchecked && objLayer.lckey === key && "primary"}
                                    variant="filled"
                                    disabled={!layerHighligh}
                                >
                                    <div className="label-group label-layer" >{title}</div>
                                </Button>
                                <div className="control-item">
                                    <Button
                                        title={gettext("Deselect Objects for Layer.")}
                                        type="text"
                                        size="small"
                                        icon={<CloseBoxOutline />}
                                        onClick={() => {
                                            deleteRow({ key: key, ckey: null, all: true })
                                            pstore?.pointDestroy();
                                            display.map.zoomToInitialExtent();
                                            visibleItems({ value: undefined });
                                        }}
                                    />
                                </div>
                            </div>
                        }
                        {
                            Object.keys(value.items).length > 0 &&
                            getEntries(value.items).map(([ckey, cvalue], fidx) => {
                                const obj = { ...store.activeChecked };
                                const ftitle = cvalue.selected.type === "vector" ? cvalue.selected.label : msgValueRaster;
                                const checked = obj.achecked && obj.ackey === ckey;
                                const contentProps = { store: pstore, display: display };
                                const ltitle = !store.visibleLayerName ? title : null;
                                return (
                                    <div key={fidx} className="label-child-element">
                                        {store.visibleLayerName ? <CircleSmall className="index-lf" /> : null}
                                        <Button
                                            title={checked ?
                                                [ftitle, gettext("Initial extent"), ltitle].join(" \n") :
                                                [ftitle, gettext("View information about the object"), ltitle].join(" \n")}
                                            onClick={() => {
                                                acOnChecked(ckey, cvalue);
                                                lOnCheckedVisibility(styleId, visibility);
                                            }}
                                            className={!visibility ? "label-child label-child-color-not-visible" : "label-child"}
                                            style={!store.visibleLayerName && { height: 40, padding: "2px 5px" }}
                                            type="text"
                                            size="small"
                                            color={checked && "primary"}
                                            variant="filled"
                                        >
                                            <div className={!store.visibleLayerName ? "label-group label" : "label-group"}>
                                                <div className={checked ? "feature-name checked" : "feature-name"} >{ftitle}</div>
                                                {!store.visibleLayerName && <sub className={checked ? "sub-feature-name sub-checked" : "sub-feature-name"}>{ltitle}</sub>}
                                            </div>
                                        </Button>
                                        {checked && layerHighligh && <div className="control-item"><ButtonZoomComponent {...contentProps} /></div>}
                                        <div className="control-item">
                                            <Button
                                                title={gettext("Deselect Object.")}
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
                    </div >
                )
            })
        }</div >)
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
            children: gettext("Deselect Objects for All Layers.")
        },
        {
            key: "4",
            label: <div className="icon-description"><CloseBoxOutline /></div>,
            children: gettext("Deselect Objects for Layer.")
        },
        {
            key: "5",
            label: <div className="icon-description"><Close /></div>,
            children: gettext("Deselect Object.")
        },
    ];

    return (
        <>
            <Descriptions
                styles={{ content: { padding: "5px" } }}
                bordered
                size="small"
                column={1}
                layout="horizontal"
                items={items}
            />
            {gettext("Maximum number of objects for one layer: 10")}
        </>
    );
};

const SelectedFeature = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(
    ({ display, store }) => {
        const { visibleItems } = useSelected(display, store);
        const pstore = display.popupStore;

        const onCheckedVisibleItems = useCallback(() => {
            store.setChecked(!store.checked);
            if (store.checked === false) {
                pstore?.pointDestroy();
                visibleItems({ value: undefined });
            }
            else {
                const visibleStyles: number[] = [];
                const items = display.treeStore.items;
                display.config.checkedItems.forEach((key) => {
                    visibleStyles.push(items.get(key).id);
                });
                display.treeStore.setVisibleIds(visibleStyles)
            }
        }, []);

        const onVisibleLayerName = useCallback(() => {
            store.setVisibleLayerName(!store.visibleLayerName);
        }, []);

        const deleteAllRow = () => {
            pstore?.pointDestroy();
            pstore?.setFixPopup(false);
            const obj = { ...store.selectedFeatures };
            getEntries(obj).map(([_, value]) => value.items = {});
            store.setSelectedFeatures(obj);
            display.map.zoomToInitialExtent();
            visibleItems({ value: undefined });
            store.setActiveLayer({
                ...store.activeLayer,
                lchecked: false,
            });
            store.setActiveChecked({
                ...store.activeChecked,
                achecked: false,
            });
        };

        const msgDefaultVisibleLayer = store.checked ? gettext("Turn on default layers visibility") : gettext("Turn off inactive layers");
        const msgFunction = gettext("Button functions:");
        const msgDescription = gettext("Description");
        const msgSelectFeature = gettext("Web map objects viewing history");
        const msgVisibleLayerName = store.visibleLayerName ? gettext("Hide layer name") : gettext("Show layer name");

        return (
            <PanelContainer
                className="ngw-webmap-selected-feature-panel"
                title={store.title}
                close={store.close}
                prolog={
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
                                title={gettext("Deselect Objects for All Layers.")}
                                type="text"
                                size="small"
                                icon={<CloseBoxMultiple />}
                                onClick={deleteAllRow}
                                disabled={store.countItems === 0}
                            />
                        </div>
                    </div>
                }
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

                <ItemSelectValue {...{ display, store }} />
            </PanelContainer>
        )
    }
);

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;