import PropTypes from "prop-types";
import { route } from "@nextgisweb/pyramid/api";
import i18n from "@nextgisweb/pyramid/i18n";

import ViewListIcon from "@material-icons/svg/view_list/outline";
import ExpandLessIcon from "@material-icons/svg/expand_less/outline";

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
    const icon = open ? <ExpandLessIcon /> : <ViewListIcon />;

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
            title={open ? hideLegendMessage : showLegendMessage}
        >
            {icon}
        </span>
    );
}

export function Legend({ nodeData, zoomToNgwExtent }) {
    if (!nodeData || !nodeData.legendInfo || !nodeData.legendInfo.open) {
        return <></>;
    }
    const asyncFunc = async (id, name) => {
        if (name) {
            const query = { ilike: name }
            const getData = async () => {
                const layer_extent = await route('layer.extent', id ).get();
                const extent = await route('feature_layer.feature.extent', id ).get({ query });
                if (extent.extent.minLon !== null) {
                    return extent.extent
                } else {
                    return layer_extent.extent
                }
            }
            getData()
                .then(extent => zoomToNgwExtent(extent))
                .catch(console.error);
        }
    };
    return (
        <div className="legend-block">
            {nodeData.legendInfo.symbols.map((s, idx) => (
                <div key={idx} className="legend-symbol" title={s.display_name}
                    onClick={() => asyncFunc(nodeData.layerId, s.display_name ? s.display_name : nodeData.title) }
                >
                    <img
                        width={20}
                        height={20}
                        src={"data:image/png;base64," + s.icon.data}
                    />
                    <div className="legend-title">{s.display_name}</div>
                </div>
            ))}
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
