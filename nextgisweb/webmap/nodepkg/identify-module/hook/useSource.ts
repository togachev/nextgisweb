import { route, routeURL } from "@nextgisweb/pyramid/api";
import lookupTableCached from "ngw-lookup-table/cached";
import type { StoreItem } from "@nextgisweb/webmap/type";
import type { DojoDisplay } from "@nextgisweb/webmap/type";
import type { DataProps } from "./type";

export const useSource = () => {

    const generateUrl = (display: DojoDisplay, { res, st, pn }) => {
        const imodule = display.identify_module;
        const lon = imodule.lonlat[0];
        const lat = imodule.lonlat[1];
        const webmapId = display.config.webmapId;
        const zoom = display.map.view.getZoom();

        const styles: string[] = [];
        Object.entries(display.webmapStore._layers).find(item => {
            const itm: StoreItem = item[1];
            if (itm._visibility === true) {
                styles.push(itm.itemConfig.styleId);
            }
        });

        const selected = [res?.styleId + ":" + res?.layerId + ":" + res?.id];
        const result = [...new Set(st?.map(a => a.styleId))];

        const panel = display.panelsManager._activePanelKey;
        const obj = res !== null ?
            { attribute: true, lon, lat, zoom, styles: styles, panel, st: result, slf: selected, pn: pn } :
            { attribute: false, lon, lat, zoom, styles: styles, panel }

        const paramsUrl = new URLSearchParams();

        Object.entries(obj)?.map(([key, value]) => {
            paramsUrl.append(key, value);
        })

        const url = routeURL("webmap.display", webmapId);
        const link = origin + url + '?' + paramsUrl.toString();

        return link;
    };

    const getAttribute = async (res: DataProps) => {
        const resourceId = res.permission !== "Forbidden" ? res.layerId : -1;
        const query = {
            dt_format: "iso",
        };
        const feature = res.permission !== "Forbidden" ? await route("feature_layer.feature.item", {
            id: res.layerId,
            fid: res.id,
        })
            .get({
                query,
            })
            .then(item => {
                return item;
            }) :
            {
                id: -1,
                geom: "POINT EMPTY",
                fields: { Forbidden: "Forbidden" },
                extensions: null
            }

        const fieldmap = res.permission !== "Forbidden" ? await route("resource.item", { id: resourceId })
            .get({
                cache: true,
            })
            .then(data => {
                const deferreds: string[] = [];
                const fieldmap = {};

                data.feature_layer.fields.map(itm => {
                    if (itm.grid_visibility) {
                        fieldmap[itm.keyname] = itm;
                    } else {
                        delete feature.fields[itm.keyname]
                    }
                    
                    if (itm.lookup_table !== null) {
                        deferreds.push(
                            lookupTableCached.load(
                                itm.lookup_table.id
                            )
                        );
                    }
                })

                return Promise.all(deferreds).then(
                    () => {
                        const value = feature.fields;
                        const rename = (renameKeys, currentObject) => {
                            return Object.keys(currentObject).reduce(
                                (acc, key) => ({
                                    ...acc,
                                    ...{ [renameKeys[key] || key]: currentObject[key] },
                                }),
                                {}
                            );
                        };
                        const renameKeys = {};
                        for (const k in value) {
                            const val = value[k];
                            const field = fieldmap[k];

                            if (field.lookup_table !== null) {
                                const lval = lookupTableCached.lookup(
                                    field.lookup_table.id,
                                    val
                                );
                                if (lval !== null) {
                                    value[k] = lval;
                                }
                            }
                            Object.assign(renameKeys, { [k]: fieldmap[k].display_name })
                        }
                        const updateName = rename(renameKeys, value)
                        return { updateName, feature, resourceId };
                    }
                );

            }) : { updateName: undefined, feature: feature, resourceId: -1 };
        return fieldmap;
    }

    return { generateUrl, getAttribute };
};
