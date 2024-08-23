import { useCallback, useEffect, useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { context, params } from "../constant";
import type { GraphProps, RequestProps, ContextItemProps } from "../type";
import type { FeatureItem } from "@nextgisweb/feature-layer/type";

export const useGraph = ({ display, topic }: GraphProps) => {
    const olmap = display.map.olMap;

    const identifyFeature = useCallback(({ response }) => {
        const { featureCount } = response;

        const relationFeature = Object.values(response)
            .reduce((k, val) => {
                if (val.features) {
                    k.push(...val.features.filter(i => i.relation));
                }
                return k;
            }, []);
        console.log(relationFeature);


        // if (featureCount > 0) {
        //     route("feature_layer.identify_layer")
        //     .get({
        //         json: request,
        //     })
        //     .then((response) => {
        //         const feat = response[0]; /* To use objects from different layers, you must use the entire array */
        //         if (feat) {
        //             display.identify_module._visible({ portal: true, overlay: undefined, key: "popup" });
        //             topic.publish("feature.unhighlight");

        //             const obj = {
        //                 column_constraint: feat.column_constraint,
        //                 column_from_const: feat.column_from_const,
        //                 column_key: feat.column_key,
        //                 fields: feat.fields,
        //                 id: feat.id,
        //                 resource_id: feat.resource_id,
        //                 geom: feat.geom,
        //             }
        //             setFeatInfo(prev => ({
        //                 ...prev,
        //                 [feat.id]: obj
        //             }))
        //         }
        //         else {
        //             setFeatInfo({});
        //             topic.publish("feature.unhighlightDiagram");
        //         }
        //     })
        // }
    })



    // const [featInfo, setFeatInfo] = useState({});

    // const checkSelect = useCallback((value, unselect) => {
    //     olmap.getLayers().forEach(layer => {
    //         if (layer.get("name") === "highlightDiagram") {
    //             const uniqueId = value.resource_id / value.id
    //             const status = layer.getSource().getFeatures().some(item => item.getProperties().uniqueId === uniqueId)

    //             if (!status) {
    //                 topic.publish("feature.highlightDiagram",
    //                     {
    //                         geom: value.geom,
    //                     },
    //                     {
    //                         uniqueId: uniqueId,
    //                     }
    //                 )
    //             }
    //             if (unselect) {
    //                 topic.publish("feature.unhighlightDiagram", uniqueId);
    //             }
    //         }
    //     })
    // })

    // useEffect(() => {
    //     if (Object.keys(featInfo).length > 0) {
    //         Object.entries(featInfo).map(([, value]) => {
    //             checkSelect(value, false);
    //         })
    //     } else {
    //         topic.publish("feature.unhighlightDiagram");
    //     }
    // }, [featInfo])

    // const displayFeatureInfo = useCallback(async (pixel: number[]) => {
    //     const request: RequestProps = {
    //         srs: 3857,
    //         geom: display.identify_module._requestGeomString(pixel),
    //         styles: [],
    //     };
    //     display.getVisibleItems().then(items => {
    //         const itemConfig = display.getItemConfig();
    //         const mapResolution = olmap.getView().getResolution();
    //         items.map(i => {
    //             const item = itemConfig[i.id];
    //             if (
    //                 item.constraintField === null ||
    //                 !item.identifiable ||
    //                 mapResolution >= item.maxResolution ||
    //                 mapResolution < item.minResolution
    //             ) {
    //                 return;
    //             }
    //             request.styles.push(item.styleId);
    //         });

    //         route("feature_layer.identify_layer")
    //             .post({
    //                 json: request,
    //             })
    //             .then((response) => {
    //                 const feat = response[0]; /* To use objects from different layers, you must use the entire array */
    //                 if (feat) {
    //                     display.identify_module._visible({ portal: true, overlay: undefined, key: "popup" });
    //                     topic.publish("feature.unhighlight");

    //                     const obj = {
    //                         column_constraint: feat.column_constraint,
    //                         column_from_const: feat.column_from_const,
    //                         column_key: feat.column_key,
    //                         fields: feat.fields,
    //                         id: feat.id,
    //                         resource_id: feat.resource_id,
    //                         geom: feat.geom,
    //                     }
    //                     setFeatInfo(prev => ({
    //                         ...prev,
    //                         [feat.id]: obj
    //                     }))
    //                 }
    //                 else {
    //                     setFeatInfo({});
    //                     topic.publish("feature.unhighlightDiagram");
    //                 }
    //             })
    //     });
    // });

    // const features = useCallback(async (value: FeatureItem) => {
    //     const feature = await route("resource.feature_diagram",
    //         value.column_key,
    //         value.column_constraint,
    //         value.fields[value.column_from_const]
    //     ).get();

    //     feature.sort(function (a, b) {
    //         return parseFloat(a.fields.year) - parseFloat(b.fields.year);
    //     });
    //     const data: ContextItemProps[] = [];
    //     Object.keys(context).map(item => {
    //         const copy: ContextItemProps = structuredClone(context[item]);
    //         feature.map(i => {
    //             if (item === i.fields.type) {
    //                 Object.assign(copy, { key: i.fields.type });
    //                 Object.assign(copy, params);
    //                 copy.data.push({ y: i.fields.value, x: i.fields.year });
    //                 copy.labels.push(i.fields.year);
    //             }
    //         })
    //         data.push(copy)
    //     })
    //     return { data, props: value }
    // })

    // return { checkSelect, displayFeatureInfo, features, featInfo, olmap, setFeatInfo };
    return { identifyFeature };
};