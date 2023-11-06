import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

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

    const zoomToLayer = gettext("Zoom to layer");
    const zoomToFeatureLayer = gettext("Zoom to feature layer");

    return item?.legendInfo.symbols.map((s, idx) => (

        <div
            key={idx}
            title={single ? item.title : s.display_name } 
            className={single ? "iconSingle" : "legend-item"}
            onClick={() => asyncFunc(item.layerId, s.display_name ? s.display_name : item.title)}
        >
            <img title={single ? zoomToLayer : zoomToFeatureLayer }
                className={single ? null : "icon-list"}
                width={20} height={20} src={"data:image/png;base64," + s.icon.data} />
            {single ? null : <span className="titleName">{s.display_name ? s.display_name : item.title}</span>}
        </div>
    
    ));

};