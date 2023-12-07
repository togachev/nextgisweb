import { gettext } from "@nextgisweb/pyramid/i18n";

import type { TreeItem } from "../type/TreeItems";
import type { DisplayMap } from "../type/DisplayMap";

import MenuFoldOutlined from "./icons/MenuFoldOutlined.svg";
import MenuUnfoldOutlined from "./icons/MenuUnfoldOutlined.svg";
import { IconItem } from "./IconItem";

import "./Legend.less";

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

export function Legend({ nodeData, zoomToNgwExtent }: { nodeData: TreeItem; zoomToNgwExtent: DisplayMap }) {
    const legendInfo = "legendInfo" in nodeData && nodeData.legendInfo;
    if (!nodeData || !legendInfo || !legendInfo.open) {
        return <></>;
    }

    return (
        <div className="legend-block">
            <IconItem
                single={false}
                item={nodeData}
                zoomToNgwExtent={zoomToNgwExtent}
            />
            {/* {legendInfo.symbols.map((s, idx) => (
                <div key={idx} className="legend-symbol" title={s.display_name}>
                    <img
                        width={20}
                        height={20}
                        src={"data:image/png;base64," + s.icon.data}
                    />
                    <div className="legend-title">{s.display_name}</div>
                </div>
            ))} */}
        </div>
    );
}
