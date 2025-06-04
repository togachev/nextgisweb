import { observer } from "mobx-react-lite";
import { Button, Space } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import DeleteOutline from "@nextgisweb/icon/mdi/delete-outline";
import EyeOutline from "@nextgisweb/icon/mdi/eye-outline";
import topic from "@nextgisweb/webmap/compat/topic";
import type { PanelPluginWidgetProps } from "../registry";
import type SelectedFeatureStore from "./SelectedFeatureStore";
import type { DataProps } from "@nextgisweb/webmap/imodule/type";

import "./SelectedFeature.less";

const simulateProps = (display, item) => {
    const value = {
        attribute: true,
        pn: "attributes",
        lon: item.lonlat[0],
        lat: item.lonlat[1],
        params: [{ id: item.styleId, label: item.desc, dop: null }],
    }
    // display.imodule.zoomToPoint(item.coordinate);
    const p = { value, coordinate: item.coordinate };
    const pixel = display.map.olMap.getPixelFromCoordinate(p.coordinate);
    const simulateEvent: any = {
        coordinate: p && p.coordinate,
        map: display.map.olMap,
        target: "map",
        pixel: [
            display.panelManager.getActivePanelName() !== "none" ?
                (pixel[0] + display.panelSize + 40) :
                (pixel[0] + 40), (pixel[1] + 40)
        ],
        type: "click"
    };
    return display.imodule._overlayInfo(simulateEvent, "popup", p, "simulate");
}

const ItemSelectValue = ({ display, store, items }) => {

    const deleteRow = (key) => {
        topic.publish("feature.unhighlight");

        display.imodule._visible({ hidden: true, overlay: undefined, key: "popup" })
        topic.publish("feature.unhighlight");
        display.imodule.iStore.setFullscreen(false)
        display.imodule.iStore.setValueRnd({ ...store.valueRnd, x: -9999, y: -9999 });

        const newObject: DataProps = { ...store.multiSelected };
        delete newObject[key];
        store.setMultiSelected(newObject);
    };

    return (
        <Space direction="vertical">
            {getEntries(items).map(([key, value]) => {
                return (
                    <Space key={key} className="row-selected">
                        <div>
                            {value.label}
                        </div>
                        <div>
                            <Button type="text" icon={<DeleteOutline />} onClick={() => deleteRow(key)} />
                            <Button type="text" icon={<EyeOutline />} onClick={() => {
                                simulateProps(display, value);
                            }} />
                        </div>
                    </Space>
                )
            })}
        </Space>
    )
}


const SelectedFeature = observer<PanelPluginWidgetProps<SelectedFeatureStore>>(
    ({ display, store }) => {
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
                {store.multiSelected && <ItemSelectValue display={display} store={store} items={store.multiSelected} />}
            </PanelContainer>
        );
    });

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;