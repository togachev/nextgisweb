import { route, routeURL } from "@nextgisweb/pyramid/api";
import { load, lookup } from "@nextgisweb/webmap/panel/identify/lookup";
import type { StoreItem } from "@nextgisweb/webmap/type";
import type { Display } from "@nextgisweb/webmap/display";
import type { DataProps } from "./type";
import dayjs from "dayjs";
import type {
    NgwDate,
    NgwDateTime,
    NgwTime,
} from "@nextgisweb/feature-layer/type";
import { gettext } from "@nextgisweb/pyramid/i18n";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

export const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

export const valDT = (val, field) => {
    const msgNA = gettext("N/A");
    if (val) {
        if (field?.datatype === "DATE") {
            const { year, month, day } = val as NgwDate;
            const dt = new Date(year, month - 1, day);
            val = dayjs(dt).format("YYYY-MM-DD");
        } else if (val && field?.datatype === "TIME") {
            const { hour, minute, second } = val as NgwTime;
            const dt = new Date(0, 0, 0, hour, minute, second);
            val = dayjs(dt).format("HH:mm:ss");
        } else if (val && field?.datatype === "DATETIME") {
            const { year, month, day, hour, minute, second } = val as NgwDateTime;
            const dt = new Date(year, month - 1, day, hour, minute, second);
            val = dayjs(dt).format("YYYY-MM-DD HH:mm:ss");
        }
        return val;
    }
    else if (val === null || val === "" || val === undefined) {
        return msgNA;
    }
}

export const useSource = (display: Display) => {
    const generateUrl = ({ res, st, pn }) => {
        const imodule = display.identify_module;
        const lon = imodule.lonlat[0];
        const lat = imodule.lonlat[1];
        const webmapId = display.config.webmapId;
        const zoom = display.map.zoom;

        const styles: string[] = [];
        Object.entries(display.webmapStore._layers).find(item => {
            const itm: StoreItem = item[1];
            if (itm.itemConfig.visibility === true) {
                styles.push(itm.itemConfig.styleId);
            }
        });

        const selected = [res?.styleId + ":" + res?.layerId + ":" + res?.id];
        const result = [...new Set(st?.map(a => a.styleId))];

        const panel = display.panelManager.getActivePanelName();

        const obj = res ?
            { attribute: true, lon, lat, zoom, styles: styles, st: result, slf: selected, pn: pn, base: display.baseLayer?.name } :
            { attribute: false, lon, lat, zoom, styles: styles, base: display.baseLayer?.name };

        panel !== "share" && Object.assign(obj, { panel: panel });

        const paramsUrl = new URLSearchParams();

        Object.entries(obj)?.map(([key, value]) => {
            paramsUrl.append(key, value);
        })

        const url = routeURL("webmap.display", webmapId);
        const link = origin + url + "?" + paramsUrl.toString();

        return link;
    };

    const getAttribute = async (res: DataProps) => {
        const resourceId = res.permission !== "Forbidden" ? res.layerId : -1;
        const item = getEntries(display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.layerId === res.layerId)?.[1];

        const query = { geom: item.itemConfig.layerHighligh === true ? true : false };
        const feature = res.permission !== "Forbidden" ? await route("feature_layer.feature.item", {
            id: res.layerId,
            fid: res.id,
        })
            .get({
                cache: true,
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
                            load(
                                itm.lookup_table.id
                            )
                        );
                    }
                })

                return Promise.all(deferreds).then(
                    () => {
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
                        const values = {};

                        getEntries(feature.fields).map(([key, val]) => {
                            const field = fieldmap[key];
                            let value = valDT(val, field);

                            if (field.lookup_table !== null) {
                                const lval = lookup(
                                    field.lookup_table.id,
                                    val
                                );
                                lval.then( result => value = result);
                            }
                            Object.assign(values, { [key]: value })
                            Object.assign(renameKeys, { [key]: field.display_name })
                        })

                        const updateName = rename(renameKeys, values);

                        return { updateName, feature, resourceId };
                    }
                );

            }) : { updateName: undefined, feature: feature, resourceId: -1 };
        return fieldmap;
    }

    return { generateUrl, getAttribute };
};