define([
    "dojo/_base/declare",
    "dojo/io-query",
    "./Adapter",
    "@nextgisweb/pyramid/api",
    "@nextgisweb/pyramid/util",
    "ngw-webmap/ol/layer/Image",
    "dojo/topic",
], function (declare, ioQuery, Adapter, api, util, Image, topic) {
    return declare(Adapter, {
        createLayer: function (item) {
            const queue = util.imageQueue;
            let p_filters = ""
            topic.subscribe("query.params_" + item.layerId,
                async (e) => {
                    if (e?.fld_field_op) {
                        p_filters = '&' + e?.fld_field_op.map(item => new URLSearchParams(item).toString()).join('&');
                    } else {
                        p_filters = ""
                    }
                    console.log(p_filters);
                    
                }
            );

            const layer = new Image(
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
                    params: {
                        resource: item.styleId,
                    },
                    ratio: 1,
                    crossOrigin: "anonymous",
                    imageLoadFunction: function (image, src) {
                        const url = src.split("?")[0];
                        const query = src.split("?")[1];
                        const queryObject = ioQuery.queryToObject(query);
                        const filter = p_filters !== "" ? p_filters : "";

                        const resource = queryObject["resource"];
                        const symbolsParam = queryObject["symbols"];
                        const symbols = symbolsParam
                            ? `&symbols[${resource}]=${symbolsParam === "-1" ? "" : symbolsParam}`
                            : "";

                        const img = image.getImage();

                        const newSrc =
                            url +
                            "?resource=" +
                            resource +
                            "&extent=" +
                            queryObject["BBOX"] +
                            "&size=" +
                            queryObject["WIDTH"] +
                            "," +
                            queryObject["HEIGHT"] +
                            filter +
                            "&nd=204" +
                            symbols;
                        // Use a timeout to prevent the queue from aborting right after adding, especially in cases with zoomToExtent.
                        setTimeout(() => {
                            queue.add(({ signal }) =>
                                util
                                    .tileLoadFunction({
                                        src: newSrc,
                                        cache: "no-cache",
                                        signal,
                                    })
                                    .then((imageUrl) => {
                                        img.src = imageUrl;
                                    })
                            );
                        });
                    },
                }
            );

            return layer;
        },
    });
});
