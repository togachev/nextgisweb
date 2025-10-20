import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { Splitter } from "@nextgisweb/gui/antd";
import { useLayout } from "@nextgisweb/pyramid/layout/useLayout";
import type { DisplayConfig } from "@nextgisweb/webmap/type/api";
import { WebMapTabs } from "@nextgisweb/webmap/webmap-tabs";

import type { TinyConfig } from "../type";

import { Display } from "./Display";
import { NavigationMenu } from "./component/NavigationMenu";
import { PanelSwitcher } from "./component/PanelSwitcher";
import { MapPane } from "./component/map-panel";
import { DisplayContext } from "./context/useDisplayContext";

import "./DisplayWidget.less";

const { Panel } = Splitter;

export interface DisplayComponentProps {
    mapChildren?: ReactNode;
    tinyConfig?: TinyConfig;
    className?: string;
    display?: Display;
    config: DisplayConfig;
}

const PANEL_MIN_HEIGHT = 20;
const PANELS_DEF_LANDSCAPE_SIZE = 350;
const PANELS_DEF_PORTRAIT_SIZE = "50%";

function getDefultPanelSize(isPortrait: boolean) {
    return isPortrait ? PANELS_DEF_PORTRAIT_SIZE : PANELS_DEF_LANDSCAPE_SIZE;
}

export const DisplayWidget = observer(
    ({
        config,
        display: displayProp,
        className,
        mapChildren,
    }: DisplayComponentProps) => {
        const [display] = useState<Display>(
            () =>
                displayProp ||
                new Display({
                    config,
                })
        );

        const { isMobile, screenReady, isPortrait } = useLayout();

        useEffect(() => {
            display.startup();
        }, [display]);

        useEffect(() => {
            display.setIsMobile(isMobile);
        }, [display, isMobile]);

        const { activePanel, panels } = display.panelManager;
        const { tabs } = display.tabsManager;

        const [panelSize, setPanelsSize] = useState<string | number>(
            getDefultPanelSize(isPortrait)
        );

        useEffect(() => {
            setPanelsSize(() => {
                return getDefultPanelSize(isPortrait);
            });
            const value = getDefultPanelSize(isPortrait)
            display.setPanelSize(value);
        }, [isPortrait, screenReady]);

        const onResize = useCallback(
            (sizes: number[]) => {
                const newPanelSize = sizes[1];
                if (activePanel) {
                    setPanelsSize(newPanelSize);
                    display.setPanelSize(newPanelSize);
                }
            },
            [activePanel]
        );
        const onResizeEnd = useCallback(
            (sizes: number[]) => {
                const newPanelSize = sizes[1];
                if (activePanel) {
                    if (newPanelSize < PANEL_MIN_HEIGHT) {
                        display.panelManager.closePanel();
                        setPanelsSize(getDefultPanelSize(isPortrait));
                        display.setPanelSize(getDefultPanelSize(isPortrait));
                    }
                }
            },
            [activePanel, display.panelManager, isPortrait]
        );

        const panelsToShow = useMemo(() => {
            if (!screenReady) {
                return [];
            }
            const showPanels = [];

            if (panels.size > 0) {
                showPanels.push(
                    <Panel
                        key="menu"
                        size="40px"
                        resizable={false}
                        style={{ flexGrow: 0, flexShrink: 0 }}
                    >
                        <NavigationMenu
                            layout={isPortrait ? "horizontal" : "vertical"}
                            store={display.panelManager}
                            display={display}
                        />
                    </Panel>,
                    <Panel
                        key="panels"
                        size={activePanel ? panelSize : 0}
                        resizable={!!activePanel}
                        style={{ flexGrow: 0, flexShrink: 0 }}
                    >
                        <PanelSwitcher display={display} />
                    </Panel>
                );
            }
            showPanels.push(
                <Panel
                    key="main"
                    min={isPortrait ? 200 : 400}
                    resizable={!!activePanel}
                >
                    <Splitter layout="vertical">
                        <Panel key="map" min={isPortrait ? 200 : 400}>
                            <MapPane display={display}>{mapChildren}</MapPane>
                        </Panel>
                        {tabs.length && (
                            <Panel key="tabs">
                                <WebMapTabs store={display.tabsManager} />
                            </Panel>
                        )}
                    </Splitter>
                </Panel>
            );

            if (isPortrait) showPanels.reverse();
            return showPanels;
        }, [
            mapChildren,
            screenReady,
            activePanel,
            isPortrait,
            panelSize,
            display,
            panels,
            tabs,
        ]);

        if (!screenReady) {
            return <></>;
        }

        return (
            <DisplayContext value={{ display }}>
                <div className={classNames("ngw-webmap-display", className)}>
                    <Splitter
                        layout={isPortrait ? "vertical" : "horizontal"}
                        onResize={onResize}
                        onResizeEnd={onResizeEnd}
                    >
                        {panelsToShow}
                    </Splitter>
                    <div id="portal-popup"></div>
                    <div id="portal-context"></div>
                </div>
            </DisplayContext>
        );
    }
);
DisplayWidget.displayName = "DisplayWidget";
