import { Fragment } from "react";
import { Col, Divider, Flex, Tag, Typography, Row } from "@nextgisweb/gui/antd";
import { PageTitle } from "@nextgisweb/pyramid/layout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";
import type { ResourceCls } from "@nextgisweb/resource/type/api";

import type { ResourceSection, ResourceSectionProps } from "../type";

import { CreateResourceButton } from "./CreateResourceButton";

import "./ResourceSectionMain.less";

interface ResourceSectionMainProps extends ResourceSectionProps {
    summary: [string, string][];
    groupMap: string[];
    creatable?: ResourceCls[];
    cls?: string;
    social?: boolean;
    read: boolean;
}

const { Link } = Typography;

const ResourceSectionMain: ResourceSection<ResourceSectionMainProps> = ({
    resourceId,
    groupMap,
    summary,
    creatable,
    cls,
    social,
    read,
}) => {
    const preview = routeURL("webmap_main.preview", resourceId);
    const urlWebmap = routeURL("webmap.display", resourceId);
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
                        <Link className="preview-link" style={{ background: `url(${preview}) center center / cover no-repeat` }} href={urlWebmap} target="_self"/>
                    </Col>
                }
            </Row>
            {read && cls === "webmap" && groupMap.length > 0 && (<Divider orientation="left" orientationMargin="0">{gettext("Web Map Groups")}</Divider>)}
            {read && cls === "webmap" && groupMap.length > 0 && (
                <Flex gap="4px 0" wrap>
                    {groupMap.map((k, idx) => (
                        <Tag key={idx}>{k}</Tag>
                    ))}
                </Flex>
            )}
        </>
    );
};

ResourceSectionMain.displayName = "ResourceSectionMain";

export { ResourceSectionMain };
