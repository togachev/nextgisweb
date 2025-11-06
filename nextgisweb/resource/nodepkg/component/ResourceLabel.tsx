import { HTMLAttributeAnchorTarget } from "react";
import { OpenInNewIcon } from "@nextgisweb/gui/icon";
import { routeURL } from "@nextgisweb/pyramid/api";
import type { ResourceCls } from "@nextgisweb/resource/type/api";
import { Col, Row } from "@nextgisweb/gui/antd";

import { ResourceIcon } from "../icon";
import "./ResourceLabel.less"

export interface ResourceLabelProps {
    cls: ResourceCls;
    cls_display_name?: string;
    resourceId?: number;
    label: string;
    target?: HTMLAttributeAnchorTarget;
}

export function ResourceLabel({
    cls,
    label,
    target = "_blank",
    resourceId,
    cls_display_name,
}: ResourceLabelProps) {

    return (
        <div className="content-data">
            <Row wrap={false} justify="space-around" align="middle">
                <Col flex="none">
                    <div style={{ padding: "0 5px" }}>
                        <ResourceIcon identity={cls} />
                    </div>
                </Col>
                <Col flex="none">
                    <div style={{ padding: "0 5px" }}>
                        {typeof resourceId === "number" && (
                            <a
                                href={routeURL("resource.show", resourceId)}
                                target={target}
                                onMouseDown={(evt) => {
                                    // Prevent from opening picker
                                    evt.stopPropagation();
                                }}
                            >
                                <OpenInNewIcon />
                            </a>
                        )}
                    </div>
                </Col>
                <Col flex="auto">
                    <div className="label" title={label}>
                        {label}
                    </div>
                </Col>

                <Col flex="none">
                    <div className="cls">
                        {cls_display_name}
                    </div>
                </Col>
            </Row>
        </div>
    );
}
