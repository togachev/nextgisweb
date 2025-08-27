import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import type ZoomToWebmapPlugin from "@nextgisweb/webmap/plugin/zoom-to-webmap";

import { LayersTree } from "../../layers-tree/LayersTree";
import { PanelContainer } from "../component";
import { usePopup } from "@nextgisweb/webmap/popup/util/function";
import settings from "@nextgisweb/webmap/client-settings";

import type { PanelPluginWidgetProps } from "../registry";

import { BasemapSelector } from "./BasemapSelector";
import { LayersDropdown } from "./LayersDropdown";

import "./LayersPanel.less";

const LayersPanel = observer<PanelPluginWidgetProps>(
    ({ store, display, ...props }) => {

        if (settings.imodule) {
            usePopup(display);
        }

        const zoomToAllLayers = () => {
            const plugin =
                display.plugins["@nextgisweb/webmap/plugin/zoom-to-webmap"];
            if (plugin) {
                (plugin as ZoomToWebmapPlugin).zoomToAllLayers();
            }
        };

        const onSelect = useCallback(
            (keys: number[]) => {
                display.handleSelect(keys);
            },
            [display]
        );

        return (
            <PanelContainer
                title={
                    <>
                        {store.title}
                        <LayersDropdown
                            onClick={(key) => {
                                if (key === "zoomToAllLayers") {
                                    zoomToAllLayers();
                                }
                            }}
                        />
                    </>
                }
                close={store.close}
                epilog={<BasemapSelector map={display.map} />}
                components={{
                    content: PanelContainer.Unpadded,
                    epilog: PanelContainer.Unpadded,
                }}
            >
                <LayersTree
                    store={display.webmapStore}
                    onSelect={onSelect}
                    setLayerZIndex={display.map.setLayerZIndex.bind(display)}
                    getWebmapPlugins={() => ({ ...display.plugins })}
                    {...props}
                />
            </PanelContainer>
        );
    }
);

LayersPanel.displayName = "LayersPanel";
export default LayersPanel;