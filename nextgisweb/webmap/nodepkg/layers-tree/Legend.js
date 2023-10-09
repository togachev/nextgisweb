import { gettext } from "@nextgisweb/pyramid/i18n";

import LegendToggle from "@nextgisweb/icon/material/legend_toggle/outline";
import KeyboardArrowDown from "@nextgisweb/icon/material/keyboard_arrow_down/outline";
import { IconItem } from "./IconItem";
import "./Legend.less";

const msgShowLegend = gettext("Show legend");
const msgHideLegend = gettext("Hide legend");

export function LegendAction({ nodeData, onClick }) {
    if (
        !nodeData ||
        !nodeData.legendInfo ||
        nodeData.legendInfo.open === undefined
    ) {
        return <></>;
    }

    const { open } = nodeData.legendInfo;
    const icon = open ? <KeyboardArrowDown /> : <LegendToggle />;

    const click = () => {
        const { id } = nodeData;
        const { open } = nodeData.legendInfo;
        nodeData.legendInfo.open = !open;
        onClick(id);
    };

    return (
        <span
            className="legend"
            onClick={click}
            title={open ? msgHideLegend : msgShowLegend}
        >
            {icon}
        </span>
    );
}

export function Legend({ nodeData }) {
    if (!nodeData || !nodeData.legendInfo || !nodeData.legendInfo.open) {
        return <></>;
    }

    return (
        <div className="legend-block">
            <IconItem
                single={false}
                item={nodeData}
                zoomToNgwExtent={zoomToNgwExtent}
            />
        </div>
    );
}
