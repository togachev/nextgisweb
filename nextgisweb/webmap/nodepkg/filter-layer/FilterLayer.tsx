import React, { useEffect, useState } from 'react';
import { Modal, Button } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { TreeItem } from "../type/TreeItems";

import type {
    DojoTopic,
} from "../panels-manager/type";

import "./FilterLayer.less";

export function FilterLayer({
    item,
    plugin,
    topic,
}: {
    item: TreeItem;
    plugin: Record<string, unknown>;
    topic: DojoTopic;
}) {
    const [open, setOpen] = useState(true);

    const destroyFilterComponent = () => {
        plugin.FilterLayerCompDomNode = undefined;
    }
    console.log(item, item.layerId, plugin, topic);

    return (
        <Modal
            open={open}
            onOk={() => { setOpen(false); destroyFilterComponent(); }}
            onCancel={() => { setOpen(false); destroyFilterComponent(); }}
        >
            <p>Filter layer content...</p>
        </Modal>
    );
}
