import { Fragment } from "react";
import { Col, Empty, Typography, Row } from "@nextgisweb/gui/antd";
import { PageTitle } from "@nextgisweb/pyramid/layout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";

import type { ResourceCls } from "@nextgisweb/resource/type/api";

import type { ResourceSection, ResourceSectionProps } from "../type";

import { CreateResourceButton } from "./CreateResourceButton";
import { MapgroupComponent } from "@nextgisweb/mapgroup/component/MapgroupComponent";

import "./ResourceSectionMain.less";

interface Groupmaps {
    display_name: string;
    enabled: boolean;
    id: number;
}

interface ResourceSectionMainProps extends ResourceSectionProps {
    summary: [string, string][];
    mapgroupdata: Groupmaps[];
    creatable?: ResourceCls[];
    cls?: string;
    social?: boolean;
    read: boolean;
}

const { Link } = Typography;

const ResourceSectionMain: ResourceSection<ResourceSectionMainProps> = ({
    resourceId,
    mapgroupdata,
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
                {cls === "webmap" &&
                    <Col flex="0 0 116px">
                        {social ? <Link className="preview-link" style={{ background: `url(${preview}) center center / cover no-repeat` }} href={urlWebmap} target="_self" /> :
                            <Link className="preview-link" href={urlWebmap} target="_self">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    styles={{ image: { height: 24, fontSize: 24 } }}
                                    description={gettext("Open webmap in new page")}
                                />
                            </Link>
                        }
                    </Col>
                }
            </Row>
            {read && mapgroupdata && mapgroupdata.length > 0 && <MapgroupComponent array={mapgroupdata} cls={cls} />}
        </>
    );
};

ResourceSectionMain.displayName = "ResourceSectionMain";

export { ResourceSectionMain };
