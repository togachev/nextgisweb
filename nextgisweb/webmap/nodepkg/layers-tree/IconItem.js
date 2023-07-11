import PropTypes from "prop-types";
import { route } from "@nextgisweb/pyramid/api";

export const IconItem = ({ item, zoomToNgwExtent }) => {
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

    return item?.legendInfo.symbols.map((s, idx) => (
        <div
            key={idx}
            title={s.display_name ? s.display_name : item.title}
            className="legend-symbol"
            onClick={() => asyncFunc(item.layerId, s.display_name ? s.display_name : item.title) }
        >
            <img width={18} height={18} src={"data:image/webp;base64," + s.icon.data}/>
            <span className="titleName">{s.display_name ? s.display_name : item.title}</span>
            
        </div>


    ));   

};

IconItem.propTypes = {
    item: PropTypes.object,
    zoomToNgwExtent: PropTypes.func,
};
