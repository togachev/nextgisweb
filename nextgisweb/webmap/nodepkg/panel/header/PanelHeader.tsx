import type { ReactNode } from "react";

import { CloseButton } from "./CloseButton";
import "./PanelHeader.less";
import { Alert } from "@nextgisweb/gui/antd";

interface PanelHeaderProps {
    title: string;
    close?: () => void;
    children?: ReactNode;
    disableIdentifyModule?: string;
}

/** @deprecated Use components from @nextgisweb/panel/component */
export function PanelHeader({ title, close, children, disableIdentifyModule }: PanelHeaderProps) {
    let info = null;
    if (disableIdentifyModule) {
        info = (
            <Alert
                message={disableIdentifyModule}
                type="warning"
                closable
            />
        );
    }

    return (
        <div key={children}>
            {info}
            <div className="ngw-webmap-panel-header">
                <span>{title}</span>
                {children}
                <div className="spacer"></div>
                <CloseButton close={close} />
            </div>
        </div>
    );
}
