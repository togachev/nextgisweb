import { observer } from "mobx-react-lite";
import { Button, Space } from "@nextgisweb/gui/antd";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { PanelContainer } from "../component";
import DeleteOutline from "@nextgisweb/icon/mdi/delete-outline";

import type { PanelPluginWidgetProps } from "../registry";
import type SelectedFeatureStore from "./SelectedFeatureStore";
import type { DataProps } from "@nextgisweb/webmap/imodule/type";

import "./SelectedFeature.less";


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
                {store.multiSelected && getEntries(store.multiSelected).map(([key, value]) => {
                    return (
                        <Space key={key}>
                            {value.desc}: {value.value} <Button icon={<DeleteOutline />} onClick={() => {
                                const newObject: DataProps = { ...store.multiSelected };
                                delete newObject[key];
                                store.setMultiSelected(newObject);
                            }} />
                        </Space>
                    )
                })}
            </PanelContainer>
        );
    });

SelectedFeature.displayName = "SelectedFeature";
export default SelectedFeature;