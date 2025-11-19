import { Fragment } from "react";
import { Button, Col, Empty, Typography, Row } from "@nextgisweb/gui/antd";
import { PageTitle } from "@nextgisweb/pyramid/layout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";

import type { ResourceCls } from "@nextgisweb/resource/type/api";

import type { ResourceSection, ResourceSectionProps } from "../type";

import Pencil from "@nextgisweb/icon/mdi/pencil-outline";
import { CreateResourceButton } from "./CreateResourceButton";
import { MapgroupComponent } from "@nextgisweb/mapgroup/component/MapgroupComponent";

import "./ResourceSectionMain.less";

interface EnabledProps {
    mapgroup_resource: boolean;
    webmap: boolean;
}

interface Groupmaps {
    display_name: string;
    enabled: EnabledProps;
    id: number;
    position: number;
}

interface ResourceSectionMainProps extends ResourceSectionProps {
    summary: [string, string][];
    mapgroupdata: Groupmaps[];
    creatable?: ResourceCls[];
    cls?: string;
    social?: boolean;
    read?: boolean;
    includes?: boolean;
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
    includes,
}) => {
    const preview = routeURL("webmap_main.preview", resourceId);
    const urlWebmap = routeURL("webmap.display", resourceId);
    const mapgroup_resource = mapgroupdata.length > 0 && mapgroupdata[0].enabled.mapgroup_resource;
    const group_style = { color: mapgroup_resource ? "var(--text-base)" : "var(--danger)" }
    const maps_style = { color: includes ? "var(--text-base)" : "var(--danger)" }

    const MapgroupSection = () => {
        if (cls === "mapgroup_resource") {
            return (
                <dl className="ngw-resource-main-section-summary">
                    <Fragment>
                        <dt>{gettext("Status group")}</dt>
                        <dd style={group_style}>{
                            mapgroup_resource ? gettext("Enabled") : gettext("Disabled")
                        }</dd>
                    </Fragment>
                </dl>
            )
        } else if (cls === "webmap") {
            if (!includes) {
                return (
                    <dl className="ngw-resource-main-section-summary">
                        <Fragment>
                            <dt>{gettext("Status webmap")}</dt>
                            <dd>
                                <Button
                                    size="small"
                                    title={gettext("Not included in groups")}
                                    href={routeURL("home_page")}
                                    target="_blank"
                                    type="link"
                                    style={maps_style}
                                >
                                    {gettext("Not included in groups")}<Pencil />
                                </Button>
                            </dd>
                        </Fragment>
                    </dl>
                )
            } else {
                return (
                    <dl className="ngw-resource-main-section-summary">
                        <Fragment>
                            <dt>{gettext("Status webmaps")}</dt>
                            <dd style={maps_style}>{gettext("Included in groups")}</dd>
                        </Fragment>
                    </dl>
                )
            }
        }
    }

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
                    <MapgroupSection />
                </Col>
                {cls === "webmap" &&
                    <Col flex="0 0 116px">
                        {social ? <Link className="preview-link" style={{ background: `url(${preview}) center center / cover no-repeat` }} href={urlWebmap} target="_self" /> :
                            <Link className="preview-link" href={urlWebmap} target="_self">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    styles={{ image: { height: 24, fontSize: 24 } }}
                                    description={gettext("Open webmap")}
                                />
                            </Link>
                        }
                    </Col>
                }
            </Row>
            {read && mapgroupdata && mapgroupdata.length > 0 && <MapgroupComponent array={mapgroupdata} cls={cls} resourceId={resourceId} includes={includes} />}
        </>
    );
};

ResourceSectionMain.displayName = "ResourceSectionMain";

export { ResourceSectionMain };
