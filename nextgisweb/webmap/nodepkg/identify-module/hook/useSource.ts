import { route, routeURL } from "@nextgisweb/pyramid/api";
import lookupTableCached from "ngw-lookup-table/cached";
import type { StoreItem } from "@nextgisweb/webmap/type";
export const useSource = () => {

    const generateUrl = (display, { res, all }) => {
        const imodule = display.identify_module;
        const lon = imodule.lonlat[0];
        const lat = imodule.lonlat[1];
        const webmapId = display.config.webmapId
        const zoom = display.map.position.zoom;
        const styles: string[] = [];
        Object.entries(display.webmapStore._layers).find(item => {
            const itm: StoreItem = item[1];
            if (itm._visibility === true) {
                styles.push(itm.itemConfig.styleId);
            }
        });
        console.log(styles);
        
        const selected = [res?.styleId + ":" + res?.layerId + ":" + res?.id];
        all?.map(i => {
            selected.push(i.styleId + ":" + i.layerId + ":" + i.id)
        })
        console.log(display);
        
        const panel = display.panelsManager._activePanelKey;
        const obj = res !== null ?
            { attribute: true, lat, lon, lid: res.layerId, fid: res.id, sid: res.styleId, zoom, styles: styles, panel, lsf: selected } :
            { attribute: false, lat, lon, zoom, styles: styles, panel }

        const paramsUrl = new URLSearchParams();

        Object.entries(obj)?.map(([key, value]) => {
            paramsUrl.append(key, value);
        })

        const url = routeURL("webmap.display", webmapId);
        const link = origin + url + '?' + paramsUrl.toString();

        return link
    };

    const getAttribute = async (res) => {
        const resourceId = res.label !== "Forbidden" ? res.layerId : -1;
        const feature = res.label !== "Forbidden" ? await route("feature_layer.feature.item_iso", {
            id: res.layerId,
            fid: res.id,
        })
            .get()
            .then(item => {
                return item;
            }) :
            {
                id: -1,
                geom: "POINT EMPTY",
                fields: {
                    Forbidden: "Forbidden"
                },
                extensions: null
            }

        const fieldmap = res.label !== "Forbidden" ? await route("resource.fields", { id: resourceId })
            .get({
                cache: true,
            })
            .then(data => {
                const deferreds: string[] = [];
                const fieldmap = {};
                data.map(itm => {
                    fieldmap[itm.keyname] = itm;
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

                            if (!fieldmap[k].grid_visibility) {
                                continue;
                            }

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
                        const _fieldmap = rename(renameKeys, value)
                        return { _fieldmap, feature, resourceId };
                    }
                );

            }) : { _fieldmap: { Forbidden: 'Forbidden' }, feature: feature, resourceId: -1 };
        return fieldmap;
    }

    return { generateUrl, getAttribute };
};
