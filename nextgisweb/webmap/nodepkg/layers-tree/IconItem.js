import PropTypes from "prop-types";
import { route } from "@nextgisweb/pyramid/api";
import i18n from "@nextgisweb/pyramid/i18n";

export const IconItem = ({ item, single, zoomToNgwExtent }) => {
    const asyncFunc = async (id, name) => {
        if (name) {
            const query = { ilike: name }
            const getData = async () => {
                const layer_extent = await route('layer.extent', id).get();
                const extent = await route('feature_layer.feature.extent', id).get({ query });
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

    const zoomToLayer = i18n.gettext("Zoom to layer");
    const zoomToFeatureLayer = i18n.gettext("Zoom to feature layer");

    return item?.legendInfo.symbols.map((s, idx) => (
        
        <div
            key={idx}
            title={single ? item.title : s.display_name } 
            className={single ? null : "colIconLegend"}
            onClick={() => asyncFunc(item.layerId, s.display_name ? s.display_name : item.title)}
        >
            <img title={single ? zoomToLayer : zoomToFeatureLayer }
                className={single ? null : "icon-list"}
                width={20} height={20} src={"data:image/png;base64," + s.icon.data} />
            {single ? null : <span className="titleName">{s.display_name ? s.display_name : item.title}</span>}
        </div>

    ));

};

IconItem.propTypes = {
    item: PropTypes.object,
    zoomToNgwExtent: PropTypes.func,
};
