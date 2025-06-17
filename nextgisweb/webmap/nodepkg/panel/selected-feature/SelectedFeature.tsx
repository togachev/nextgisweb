import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { Alert, Button } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import Close from "@nextgisweb/icon/mdi/close";
import CloseBoxOutline from "@nextgisweb/icon/mdi/close-box-outline";
import CloseBoxMultiple from "@nextgisweb/icon/mdi/close-box-multiple";
import FormatListBulleted from "@nextgisweb/icon/mdi/format-list-bulleted";
import DisabledVisible from "@nextgisweb/icon/material/disabled_visible";
import Visibility from "@nextgisweb/icon/material/visibility";
import { useSelected } from "./hook/useSelected";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { TemplateLink } from "@nextgisweb/gui/component";

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
                {store.visibleLayerName && <div className="item-label">
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
                            title={gettext("Clear selection of objects from current layer")}
                            type="text"
                            size="small"
                            icon={<CloseBoxOutline />}
                            onClick={() => {
                                deleteRow({ key: key, ckey: null, all: true })
                                imodule.popup_destroy();
                                display._zoomToInitialExtent();
                                visibleItems({ value: undefined });
                            }}
                        />
                    </div>
                </div>}
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



const InfoSelect = ({ count }) => {
    if (count > 0) return <></>;
    const msgFunction = gettext("Функции кнопок:");
    const msgInfoSelect = [
        gettext("1. Включение/выключение слоев по умолчанию при просмотре информации об объекте."),
        gettext("2. Скрытие наименований слоев."),
        gettext("3. Удаление всех выделенных объектов."),
        gettext("4. Удаление части выделенных объектов для каждого слоя."),
        gettext("5. Удаление одного объекта."),
    ];
    return (
        <Alert
            type="warning"
            message={msgFunction}
            description={msgInfoSelect.join(" \n")}
            closable
        />
    );
};

const SelectedFeature = observer<PanelPluginWidgetProps>(
    ({ display, store }) => {
        const { visibleItems } = useSelected(display, store);

        const onCheckedVisibleItems = useCallback(() => {
            store.setChecked(!store.checked);
            if (store.checked === false) {
                display.imodule.popup_destroy();
                visibleItems({ value: undefined });
                display._zoomToInitialExtent();
            }
        }, []);

        const onVisibleLayerName = useCallback(() => {
            store.setVisibleLayerName(!store.visibleLayerName);
        }, []);

        const deleteAllRow = () => {
            display.imodule.popup_destroy();
            const newObject = { ...store.selectedFeatures };
            getEntries(newObject).map(([_, value]) => value.items = {});
            store.setSelectedFeatures(newObject);
            display._zoomToInitialExtent();
            visibleItems({ value: undefined });
        };

        const msgDefaultVisibleLayer = store.checked ? gettext("Turn on default layers visibility") : gettext("Turn off inactive layers");

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
                <InfoSelect count={store.countItems} />
                <div className="control-visible">
                    <Button
                        title={msgDefaultVisibleLayer}
                        type="text"
                        size="small"
                        icon={store.checked ? <DisabledVisible /> : <Visibility />}
                        onClick={onCheckedVisibleItems}
                        color={store.checked && "primary"}
                        variant="filled"
                        disabled={store.countItems === 0}
                    />
                    <div className="control-item">
                        <Button
                            title={msgVisibleLayerName}
                            type="text"
                            size="small"
                            icon={<FormatListBulleted />}
                            onClick={onVisibleLayerName}
                            color={!store.visibleLayerName && "primary"}
                            variant="filled"
                            disabled={store.countItems === 0}
                        />
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