import { Button, message } from "@nextgisweb/gui/antd";
import type { ButtonProps } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api/route";
import LinkIcon from "@nextgisweb/icon/mdi/link";
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./FeatureLink.less";

interface FeatureInfo {
    layerId: number;
    id: number;
}

interface FeatureLinkProps extends ButtonProps {
    featureInfo: FeatureInfo;
    zoom: number;
    webmapId: number;
    coordinates: number[];
}

export const FeatureLink = ({ featureInfo, zoom, webmapId, coordinates }: FeatureLinkProps) => {
    const [messageApi, contextHolder] = message.useMessage();

    const messageInfo = () => {
        messageApi.open({
            type: 'info',
            content: gettext("Object reference copied"),
            duration: 2,
        });
    };

    const obj = featureInfo ?
        { hl_lid: featureInfo.layerId, hl_attr: "id", hl_val: featureInfo.id, zoom: zoom } :
        { lon: coordinates[0], lat: coordinates[1], zoom: zoom };

    const params = new URLSearchParams();

    Object.entries(obj)?.map(([key, value]) => {
        params.append(key, value);
    })

    const url = routeURL("webmap.display", webmapId);
    const featureUrl = origin + url + '?' + params.toString();
    const copyLink = async () => {
        await navigator.clipboard.writeText(featureUrl);
        messageInfo();
    };

    return (
        <>
            {contextHolder}
            <Button
                size="small"
                type="link"
                title={gettext("Object link")}
                className="copy-to-clipboard"
                icon={<LinkIcon />}
                onClick={() => {
                    copyLink();
                }}
            />
        </>

    );
};
