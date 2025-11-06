import type { HTMLAttributeAnchorTarget } from "react";
import { OpenInNewIcon } from "@nextgisweb/gui/icon";
import { routeURL } from "@nextgisweb/pyramid/api";
import type { ResourceCls } from "@nextgisweb/resource/type/api";

import { ResourceIcon } from "../icon";

export interface ResourceLabelProps {
    cls: ResourceCls;
    cls_display_name: string;
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
        <div className="content">
            <div className="icon-cls"><ResourceIcon identity={cls} /></div>
            <div className="label">
                <div title={label} className="value">{label}</div>
                <div className="cls">
                    {cls_display_name}
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
            </div>
        </div>
    );
}
