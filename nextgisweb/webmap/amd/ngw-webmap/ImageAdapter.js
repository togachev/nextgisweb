define([
    "dojo/_base/declare",
    "dojo/io-query",
    "./Adapter",
    "@nextgisweb/pyramid/api",
    "ngw-webmap/ol/layer/Image",
    "dojo/topic",
], (declare, ioQuery, Adapter, api, Image, topic) => {
    return declare(Adapter, {
        createLayer: (item) => {
            var _filters = "", p_filters = ""
            topic.subscribe("query.params",
                async (e) => {
                    if (e?.fld_field_op && e?.fld_field_op.resourceId === item.layerId) {
                        _filters = e?.fld_field_op;
                        let { resourceId, keyname, ...filterData } = _filters;
                        p_filters = '&' + new URLSearchParams(filterData).toString();
                    } else {
                        p_filters = ""
                    }
                }
            );

            var layer = new Image(
                item.id,
                {
                    maxResolution: item.maxResolution
                        ? item.maxResolution
                        : undefined,
                    minResolution: item.minResolution
                        ? item.minResolution
                        : undefined,
                    visible: item.visibility,
                    opacity: item.transparency
                        ? 1 - item.transparency / 100
                        : 1.0,
                },
                {
                    url: api.routeURL("render.image"),
                    params: { resource: item.styleId, },
                    ratio: 1,
                    crossOrigin: "anonymous",
                    imageLoadFunction: (image, src) => {
                        var url = src.split("?")[0];
                        var query = src.split("?")[1];
                        var queryObject = ioQuery.queryToObject(query);
                        var filter = p_filters !== "" ? p_filters : "";
                        image.getImage().src =
                            url +
                            "?resource=" +
                            queryObject["resource"] +
                            "&extent=" +
                            queryObject["BBOX"] +
                            "&size=" +
                            queryObject["WIDTH"] +
                            "," +
                            queryObject["HEIGHT"] +
                            filter +
                            "&nd=204" +
                            "#" +
                            Date.now(); // in-memory cache busting
                    },
                }
            );

            return layer;
        },
    });
});
