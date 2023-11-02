import { gettext } from "@nextgisweb/pyramid/i18n";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
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
    const icon = open ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />;

    const click = () => {
        const { id } = nodeData;
        const { open } = nodeData.legendInfo;
        nodeData.legendInfo.open = !open;
        onClick(id);
    };

    return (
        <span
            className="legend legend-list"
            onClick={click}
            title={open ? msgHideLegend : msgShowLegend}
        >
            {icon}
        </span>
    );
}

export function Legend({ nodeData, zoomToNgwExtent }) {
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
