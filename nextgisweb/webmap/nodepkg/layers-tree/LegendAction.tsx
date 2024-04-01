import type { MouseEvent } from "react";

import { gettext } from "@nextgisweb/pyramid/i18n";

import type { TreeItem } from "../type/TreeItems";

import ExpandMore from "@nextgisweb/icon/material/expand_more";
import CheckList from "@nextgisweb/icon/material/checklist";

const msgShowLegend = gettext("Show legend");
const msgHideLegend = gettext("Hide legend");

export function LegendAction({
    nodeData,
    onClick,
}: {
    nodeData: TreeItem;
    onClick: (id: number) => void;
}) {
    const legendInfo = "legendInfo" in nodeData && nodeData.legendInfo;
    if (!nodeData || !legendInfo || legendInfo.open === undefined) {
        return <></>;
    }

    const { open } = nodeData.legendInfo;
    const icon = open ? <ExpandMore /> : <CheckList />;

    const click = (evt: MouseEvent) => {
        evt.stopPropagation();
        nodeData.legendInfo.open = !nodeData.legendInfo.open;
        onClick(nodeData.id);
    };

    return (
        <span
            className="more legend-list"
            onClick={click}
            title={open ? msgHideLegend : msgShowLegend}
        >
            {icon}
        </span>
    );
}
