import PropTypes from "prop-types";
import i18n from "@nextgisweb/pyramid/i18n";

import LegendToggle from "@material-icons/svg/legend_toggle/outline";
import KeyboardArrowDown from "@material-icons/svg/keyboard_arrow_down/outline";
import { IconItem } from "./IconItem";
import "./Legend.less";

const showLegendMessage = i18n.gettext("Show legend");
const hideLegendMessage = i18n.gettext("Hide legend");

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
        <div className="legend-list">
            <span
                className="legend legend-toggle"
                onClick={click}
                title={open ? hideLegendMessage : showLegendMessage}
            >
                {icon}
            </span>
        </div>

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

LegendAction.propTypes = {
    nodeData: PropTypes.object,
    onClick: PropTypes.func,
};

Legend.propTypes = {
    nodeData: PropTypes.object,
    zoomToNgwExtent: PropTypes.func,
};
