import { useMemo } from "react";
import { useRouteGet } from "@nextgisweb/pyramid/hook";
import { gettext } from "@nextgisweb/pyramid/i18n";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import {
    formatCoordinatesValue,
    formatMetersArea,
    formatMetersLength,
} from "@nextgisweb/webmap/utils/format-units";
import { getGeometryTypeTitle } from "@nextgisweb/webmap/utils/geometry-types";
import { ConfigProvider, Descriptions } from "@nextgisweb/gui/antd";
import type { DefaultConfig } from "@nextgisweb/webmap/utils/format-units";
import type { DescriptionsProps } from "@nextgisweb/gui/antd";
import type { GeometryInfo } from "../type/GeometryInfo";

import "./GeometryInfo.less";

const locale = dojoConfig.locale;
const formatConfig: DefaultConfig = {
    format: "jsx",
    locale,
};

const formatLength = (length: number) => formatMetersLength(length, webmapSettings.units_length, formatConfig);
const formatArea = (area: number) => formatMetersArea(area, webmapSettings.units_area, formatConfig);

export function GeometryInfo({
    layerId,
    featureId,
}: {
    layerId: number;
    featureId: number;
}) {
    const {
        data: geometryInfo,
    } = useRouteGet<GeometryInfo>({
        name: "feature_layer.feature.geometry_info",
        params: {
            id: layerId,
            fid: featureId,
        },
        options: {
            query: {
                srs: webmapSettings.measurement_srid,
            },
        },
    });

    const geometryInfoColumns = useMemo(() => {
        const items: DescriptionsProps['items'] = [
            {
                key: gettext("Geometry type"),
                label: gettext("Geometry type"),
                children: getGeometryTypeTitle(geometryInfo?.type.toLowerCase()),
            },
            {
                key: gettext("Extent (xMin)"),
                label: gettext("Extent (xMin)"),
                children: formatCoordinatesValue(geometryInfo?.extent.minX),
            },
            {
                key: gettext("Extent (yMin)"),
                label: gettext("Extent (yMin)"),
                children: formatCoordinatesValue(geometryInfo?.extent.minY),
            },
            {
                key: gettext("Extent (xMax)"),
                label: gettext("Extent (xMax)"),
                children: formatCoordinatesValue(geometryInfo?.extent.maxX),
            },
            {
                key: gettext("Extent (yMax)"),
                label: gettext("Extent (yMax)"),
                children: formatCoordinatesValue(geometryInfo?.extent.maxY),
            },
        ];

        geometryInfo?.length !== null && items.splice(1, 0, {
            key: geometryInfo?.type.toLowerCase().includes("polygon") ? gettext("Perimeter") : gettext("Length"),
            label: geometryInfo?.type.toLowerCase().includes("polygon") ? gettext("Perimeter") : gettext("Length"),
            children: formatLength(geometryInfo?.length),
        });

        geometryInfo?.area !== null && items.splice(1, 0, {
            key: gettext("Area"),
            label: gettext("Area"),
            children: formatArea(geometryInfo?.area),
        })

        return items;
    }, [featureId, layerId, geometryInfo]);

    return (
        <ConfigProvider
            theme={{
                token: {
                    borderRadiusLG: 0,
                    padding: 5,
                    paddingXS: 2,
                },
            }}
        >
            <Descriptions bordered size="small" column={1} layout="hirizontal" items={geometryInfoColumns} />
        </ConfigProvider>
    )
}