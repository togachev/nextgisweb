import { Fragment } from "react";
import { Button, Col, Divider, Flex, Typography, Row, Space } from "@nextgisweb/gui/antd";
import { PageTitle } from "@nextgisweb/pyramid/layout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import type { ResourceCls } from "@nextgisweb/resource/type/api";

import type { ResourceSection, ResourceSectionProps } from "../type";

import { CreateResourceButton } from "./CreateResourceButton";

import "./ResourceSectionMain.less";

interface Groupmaps {
    display_name: string;
    webmap_name: string;
    enabled: boolean;
    resource_id: number;
}

interface ResourceSectionMainProps extends ResourceSectionProps {
    summary: [string, string][];
    groupmaps: Groupmaps[];
    creatable?: ResourceCls[];
    cls?: string;
    social?: boolean;
    read: boolean;
}

const { Link } = Typography;

const ResourceSectionMain: ResourceSection<ResourceSectionMainProps> = ({
    resourceId,
    groupmaps,
    summary,
    creatable,
    cls,
    social,
    read,
}) => {
    const preview = routeURL("webmap_main.preview", resourceId);
    const urlWebmap = routeURL("webmap.display", resourceId);

    const { data: groupData } = useRouteGet({
        name: "mapgroup.item",
        params: { id: resourceId },
    });
    console.log(groupData);

    return (
        <>
            <PageTitle pullRight>
                {creatable && creatable.length > 0 && (
                    <CreateResourceButton
                        resourceId={resourceId}
                        creatable={creatable}
                    />
                )}
            </PageTitle>
            <Row>
                <Col flex="auto">
                    {summary.length > 0 && (
                        <dl className="ngw-resource-main-section-summary">
                            {summary.map(([k, v], idx) => (
                                <Fragment key={idx}>
                                    <dt>{k}</dt>
                                    <dd>{v}</dd>
                                </Fragment>
                            ))}
                        </dl>
                    )}
                </Col>
                {cls === "webmap" && social &&
                    <Col flex="0 0 116px">
                        <Link className="preview-link" style={{ background: `url(${preview}) center center / cover no-repeat` }} href={urlWebmap} target="_self" />
                    </Col>
                }
            </Row>
            {read && cls === "webmap" && groupmaps.length > 0 && (<Divider orientation="left" orientationMargin="0">{gettext("Web Map Groups")}</Divider>)}
            {read && cls === "webmap" && groupmaps.length > 0 && (
                <Flex gap="small" align="flex-start" vertical>
                    <Flex gap="small" wrap>
                        {groupmaps.sort((a, b) => Number(a.resource_id) - Number(b.resource_id)).map((k) => (
                            <Button
                                variant="filled"
                                size="small"
                                type={k.enabled ? "primary" : "default"}
                                color={k.enabled ? "primary" : "default"}
                                key={k.resource_id}
                                href={routeURL("resource.show", k.resource_id)}
                                target="_self"
                            >
                                {k.display_name}: {k.enabled ? gettext("enabled") : gettext("disabled")}
                            </Button>
                        ))}
                    </Flex>
                </Flex>
            )}
            <Space size="small" direction="horizontal">{read && cls === "mapgroup_resource" && groupData && groupData.map((item) => (
                <Link key={item.idx} className="map-link" href={routeURL("resource.show", item.id)} target="_self">{item.display_name}</Link>
            ))}</Space>
        </>
    );
};

ResourceSectionMain.displayName = "ResourceSectionMain";

export { ResourceSectionMain };
