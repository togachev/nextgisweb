import { Tabs } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import UploadIcon from "@nextgisweb/icon/material/upload/outline";
import Draw from "@nextgisweb/icon/material/draw/outline";

import "./CustomLayer.less";
import { PanelHeader } from "../header";

import { UploadLayer } from "./UploadLayer";
import { DrawFeatures } from "./DrawFeatures";
import type { DojoDisplay } from "../type";
import type { DojoTopic } from "../panels-manager/type";

interface CustomLayerProps {
    display: DojoDisplay;
    topic: DojoTopic;
    close: () => void;
}

const title = gettext("CustomLayer")
const loading = gettext("Loading")
const creation = gettext("Creation")

const disableIdentifyModule = gettext("When the panel is active, layer identification is disabled.");

export function CustomLayer({ display, close, topic }: CustomLayerProps) {

    const items = [
        {
            key: "1",
            label: loading,
            children:
                <UploadLayer display={display} topic={topic} />,
            icon: <UploadIcon />,
        },
        {
            key: "2",
            label: creation,
            children:
                <DrawFeatures display={display} topic={topic} />,
            icon: <Draw />,
        },
    ];

    return (
        <div className="ngw-webmap-custom-layer-panel">
            <PanelHeader {...{ title, close, disableIdentifyModule }} />
            <Tabs
                items={items}
                defaultActiveKey="1"
                type="card"
            />
        </div>
    );
};