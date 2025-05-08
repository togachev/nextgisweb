import { Tabs } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import UploadIcon from "@nextgisweb/icon/material/upload/outline";
import Draw from "@nextgisweb/icon/material/draw/outline";
import { observer } from "mobx-react-lite";
import { Alert } from "@nextgisweb/gui/antd";
import "./CustomLayer.less";
import { PanelContainer } from "../component";
import type { PanelPluginWidgetProps } from "../registry";

import { UploadLayer } from "./UploadLayer";
import { DrawFeatures } from "./DrawFeatures";

const loading = gettext("Loading")
const creation = gettext("Creation")

const disableIModule = gettext("When the panel is active, layer identification is disabled.");

const CustomLayer = observer<PanelPluginWidgetProps>(({ store, display }) => {

    const items = [
        {
            key: "1",
            label: loading,
            children:
                <UploadLayer display={display} />,
            icon: <UploadIcon />,
        },
        {
            key: "2",
            label: creation,
            children:
                <DrawFeatures display={display} />,
            icon: <Draw />,
        },
    ];

    let info = null;
    if (disableIModule) {
        info = (
            <Alert
                message={disableIModule}
                type="warning"
                closable
            />
        );
    }

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
            {info}
            <Tabs
                items={items}
                defaultActiveKey="1"
                type="card"
            />
        </PanelContainer>
    );
});

CustomLayer.displayName = "CustomLayer";
export default CustomLayer;