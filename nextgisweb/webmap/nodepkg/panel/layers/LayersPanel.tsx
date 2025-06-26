import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import type ZoomToWebmapPlugin from "@nextgisweb/webmap/plugin/zoom-to-webmap";
import Overlay from 'ol/Overlay.js';
import { LayersTree } from "../../layers-tree/LayersTree";
import { PanelContainer } from "../component";
import type { PanelPluginWidgetProps } from "../registry";
import { toStringHDMS } from 'ol/coordinate.js';
import { BasemapSelector } from "./BasemapSelector";
import { LayersDropdown } from "./LayersDropdown";
import { toLonLat } from 'ol/proj.js';
import "./LayersPanel.less";

const LayersPanel = observer<PanelPluginWidgetProps>(
    ({ store, display, ...props }) => {
        const zoomToAllLayers = () => {
            const plugin =
                display.plugins["@nextgisweb/webmap/plugin/zoom-to-webmap"];
            if (plugin) {
                (plugin as ZoomToWebmapPlugin).zoomToAllLayers();
            }
        };

        // const container = document.getElementById('popup');
        // display.mapNode.appendChild(container); 

        // const overlay = new Overlay({
        //     element: display.mapNode,
        //     autoPan: {
        //         animation: {
        //             duration: 250,
        //         },
        //     },
        // });

        // 
        const overlayElement = document.createElement('div');
        overlayElement.className = 'my-overlay';
        overlayElement.innerHTML = 'This is my overlay!';
        const overlay = new Overlay({
            element: overlayElement,
            position: [0, 0], // Example coordinate
            positioning: 'center-center',
            stopEvent: false,
        });
        display.map.olMap.addOverlay(overlay);
        useEffect(() => {
            display.map.olMap.on("click", (e) => {
                const coordinate = e.coordinate;
                const hdms = toStringHDMS(toLonLat(coordinate));
                console.log(display);

                // content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
                overlay.setPosition(coordinate);
            });
        }, [])

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
                    onSelect={display.handleSelect.bind(display)}
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
