import Feature from "ol/Feature";
import WKT from "ol/format/WKT";
import { useCallback, useEffect, useRef, useState } from "react";

import { FeatureGrid } from "@nextgisweb/feature-layer/feature-grid/FeatureGrid";
import { FeatureGridStore } from "@nextgisweb/feature-layer/feature-grid/FeatureGridStore";
import type { ActionProps } from "@nextgisweb/feature-layer/feature-grid/type";
import type { FeatureItem } from "@nextgisweb/feature-layer/type";
import type { NgwExtent } from "@nextgisweb/feature-layer/type/api";
import { message } from "@nextgisweb/gui/antd";
import type { NoticeType } from "@nextgisweb/gui/antd";
import { route } from "@nextgisweb/pyramid/api/route";
import { gettext } from "@nextgisweb/pyramid/i18n";
import FilterExtentBtn from "@nextgisweb/webmap/filter-extent-btn";
import type { FeatureLayerWebMapPluginConfig } from "@nextgisweb/webmap/plugin/type";
import type { LayerItemConfig } from "@nextgisweb/webmap/type/api";
import ZoomToFilteredBtn from "@nextgisweb/webmap/zoom-to-filtered-btn";

import type topic from "../compat/topic";
import type { Display } from "../display";
import type { PluginBase } from "../plugin/PluginBase";

import GoToIcon from "@nextgisweb/icon/material/center_focus_weak";

const msgGoto = gettext("Go to");

interface WebMapFeatureGridTabProps {
    plugin: PluginBase;
    layerId: number;
    topic: typeof topic;
}

const wkt = new WKT();

export function WebMapFeatureGridTab({
    topic,
    plugin,
    layerId,
}: WebMapFeatureGridTabProps) {
    const topicHandlers = useRef<ReturnType<typeof topic.subscribe>[]>([]);

    const display = useRef<Display>(plugin.display);
    const itemConfig = useRef<LayerItemConfig>(display.current.itemConfig);
    const data = useRef<FeatureLayerWebMapPluginConfig>(
        itemConfig.current?.plugin[
            plugin.identity as string
        ] as FeatureLayerWebMapPluginConfig
    );

    const reloadLayer = useCallback(async () => {
        // It is possible to have few webmap layers for one resource id
        const layers = await display.current?.webmapStore.filterLayers({
            query: { layerId },
        });

        layers?.forEach((item) => {
            const layer = display.current?.webmapStore.getLayer(item.id);
            layer?.reload();
        });
    }, [layerId]);

    const [messageApi, contextHolder] = message.useMessage();

    const showMessage = (type: NoticeType, content: string) => {
        messageApi.open({
            type: type,
            content: content,
        });
    };

    const [store] = useState(
        () =>
            new FeatureGridStore({
                id: layerId,
                readonly: data.current?.readonly ?? true,
                size: "small",
                cleanSelectedOnFilter: false,
                onDelete: reloadLayer,
                onSave: () => {
                    display.current.identify_module?.identifyStore.setUpdate(true)
                    display.current.identify?._popup.widget?.reset();
                    reloadLayer();
                },
                onOpen: ({ featureId, resourceId }) => {
                    display.current.identify?.identifyFeatureByAttrValue(
                        resourceId,
                        "id",
                        featureId
                    );
                },

                onSelect: (newVal) => {
                    store.setSelectedIds(newVal);
                    const fid = newVal[0];
                    if (fid !== undefined) {
                        const query = itemConfig.current.layerHighligh === true ? { geom: true } : { geom: false };
                        Object.assign(query, {
                            dt_format: "iso",
                            fields: [],
                            extensions: [],
                        });
                        route("feature_layer.feature.item", {
                            id: layerId,
                            fid,
                        })
                            .get<FeatureItem>({
                                query
                            })
                            .then((feature) => {
                                display.current.featureHighlighter.highlightFeature(
                                    {
                                        geom: feature.geom,
                                        featureId: feature.id,
                                        layerId,
                                    }
                                );
                            });
                    } else {
                        display.current.featureHighlighter.unhighlightFeature(
                            (f) => f?.getProperties?.()?.layerId === layerId
                        );
                    }
                },
                actions: [
                    {
                        title: msgGoto,
                        icon: <GoToIcon />,
                        disabled: (params) => !params?.selectedIds?.length,
                        action: () => {
                            const fid = store.selectedIds[0];
                            const query = { geom: true };
                            Object.assign(query, {
                                dt_format: "iso",
                                fields: [],
                                extensions: [],
                            });
                            if (fid !== undefined) {
                                route("feature_layer.feature.item", {
                                    id: layerId,
                                    fid,
                                })
                                    .get<FeatureItem>({
                                        cache: true,
                                        query
                                    })
                                    .then((feature) => {
                                        if (feature.geom !== null) {
                                            const geometry = wkt.readGeometry(feature.geom);
                                            display.current.map.zoomToFeature(
                                                new Feature({ geometry })
                                            );
                                        } else {
                                            showMessage(
                                                "warning",
                                                gettext(
                                                    "Selected feature has no geometry"
                                                )
                                            );
                                        }
                                    });
                            }
                        },
                    },
                    "separator",
                    (props) => (
                        <>
                            {contextHolder}
                            <ZoomToFilteredBtn
                                {...props}
                                queryParams={store.queryParams}
                                onZoomToFiltered={(ngwExtent: NgwExtent) => {
                                    display.current.map.zoomToNgwExtent(
                                        ngwExtent,
                                        {
                                            displayProjection:
                                                display.current
                                                    .displayProjection,
                                        }
                                    );
                                }}
                            />
                        </>
                    ),
                    (props: ActionProps) => {
                        return (
                            <FilterExtentBtn
                                {...props}
                                display={display.current}
                                onGeomChange={(_, geomWKT) => {
                                    geomWKT ?
                                        store.setQueryParams((prev) => ({
                                            ...prev,
                                            intersects: geomWKT,
                                        })) :
                                        store.setQueryParams(null)
                                }}
                            />
                        );
                    },
                ],
            })
    );

    const featureHighlightedEvent = useCallback(
        ({
            featureId,
            layerId: eventLayerId,
        }: {
            featureId: number;
            layerId: number;
        }) => {
            if (featureId !== undefined && eventLayerId === layerId) {
                store.setSelectedIds([featureId]);
            } else {
                store.setSelectedIds([]);
            }
        },
        [layerId, store]
    );

    const featureUpdatedEvent = useCallback(
        ({ resourceId }: { resourceId: number }) => {
            if (layerId === resourceId) {
                store.bumpVersion();
                reloadLayer();
            }
        },
        [layerId, reloadLayer, store]
    );

    const subscribe = useCallback(() => {
        topicHandlers.current.push(
            topic.subscribe("feature.highlight", featureHighlightedEvent),
            topic.subscribe(
                "feature.unhighlight",
                store.setSelectedIds.bind(null, [])
            ),
            topic.subscribe("feature.updated", featureUpdatedEvent),
            topic.subscribe("/webmap/feature-table/refresh", () => {
                store.setQueryParams(null);
                store.bumpVersion();
            })
        );
    }, [featureHighlightedEvent, featureUpdatedEvent, topic, store]);

    const unsubscribe = () => {
        topicHandlers.current.forEach((handler) => handler.remove());
        topicHandlers.current = [];
    };

    useEffect(() => {
        subscribe();

        const highlightedFeatures =
            display.current.featureHighlighter.getHighlighted();
        const selected: number[] = highlightedFeatures
            .filter((f) => f.getProperties?.()?.layerId === layerId)
            .map((f) => f.getProperties().featureId);

        store.setSelectedIds(selected);

        return unsubscribe;
    }, [subscribe, layerId, store]);

    return <FeatureGrid id={layerId} store={store} />;
}
