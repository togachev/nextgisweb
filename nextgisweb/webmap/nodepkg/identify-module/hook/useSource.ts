import { route, routeURL } from "@nextgisweb/pyramid/api";
import { fieldValuesToDataSource, getFieldsInfo } from "@nextgisweb/webmap/panel/identify/fields";

import type { StoreItem } from "@nextgisweb/webmap/type";
import type { Display } from "@nextgisweb/webmap/display";
import type { DataProps } from "./type";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

export const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

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

    const getAttribute = async (res: DataProps, key) => {
        const resourceId = res.permission !== "Forbidden" ? res.layerId : -1;
        const item = getEntries(display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.layerId === res.layerId)?.[1];

        const query = { geom: item && item.itemConfig.layerHighligh === true ? true : false };

        const feature = res.permission !== "Forbidden" ? await route("feature_layer.feature.item", {
            id: resourceId,
            fid: res.id,
        })
            .get({
                cache: !key ? true : false,
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
        if (res.permission !== "Forbidden") {
            const fieldsInfo = await getFieldsInfo(resourceId);
            const { fields } = feature;
            const abortController = new AbortController();
            const dataSource = fieldValuesToDataSource(fields, fieldsInfo, {
                signal: abortController.signal,
            });
            return { dataSource, feature, resourceId };
        } else {
            return { updateName: undefined, feature: feature, resourceId: -1 };
        }
    }

    return { generateUrl, getAttribute };
};