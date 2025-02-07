import { useMemo } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import {
    formatCoordinatesValue,
    formatMetersArea,
    formatMetersLength,
} from "@nextgisweb/webmap/utils/format-units";
import { ConfigProvider, Descriptions, Spin } from "@nextgisweb/gui/antd";

import type { DescriptionsProps } from "@nextgisweb/gui/antd";
import type { DefaultConfig } from "@nextgisweb/webmap/utils/format-units";
import { getGeometryTypeTitle } from "@nextgisweb/webmap/utils/geometry-types";

import type { GeometryInfo } from "../../type/GeometryInfo";
import "./GeometryInfoTable.less";

const locale = dojoConfig.locale;
const formatConfig: DefaultConfig = {
    format: "jsx",
    locale,
};

const formatLength = (length: number) =>
    formatMetersLength(length, webmapSettings.units_length, formatConfig);
const formatArea = (area: number) =>
    formatMetersArea(area, webmapSettings.units_area, formatConfig);

export function GeometryInfoTable({
    geometryInfo,
    isLoading,
    error,
    resourceId,
    featureId,
}: {
    geometryInfo: GeometryInfo;
    isLoading: boolean;
    error: boolean;
    resourceId: number;
    featureId: number;
}) {

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
    }, [featureId, resourceId, geometryInfo]);

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
            {
                isLoading ?
                    (<div className="loading"><Spin /><div>{gettext("Load geometry info...")}</div></div>) :
                    error || !geometryInfo ?
                        (<div className="error"><div>{gettext("Failed to get information about the geometry")}</div></div>) :
                        (<Descriptions
                            styles={{ label: { wordBreak: "break-all", width: "calc(50%)" } }}
                            bordered
                            size="small"
                            column={1}
                            layout="hirizontal"
                            items={geometryInfoColumns}
                        />)
            }
        </ConfigProvider>
    );
}
