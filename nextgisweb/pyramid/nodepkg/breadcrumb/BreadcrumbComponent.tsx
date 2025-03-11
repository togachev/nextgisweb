import { useMemo, useState } from "react";
import { Breadcrumb } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import { route, routeURL } from "@nextgisweb/pyramid/api";

import "./BreadcrumbComponent.less";

interface BreadcrumbProps {
    href?: string;
    icon?: string;
    title?: string;
    id?: number;
}

interface BreadcrumbComponentProps {
    bcpath?: BreadcrumbProps[];
    current_id?: number;
}

export const BreadcrumbComponent = ({ bcpath, current_id }: BreadcrumbComponentProps) => {
    const [value, setValue] = useState([]);

    const getCollection = async ({ id, href, icon, title }: BreadcrumbProps) => {
        return await route("resource.collection").get({
            query: { parent: id },
            cache: true,
        })
            .then(item => item.filter(item => item.resource.cls === "resource_group" || item.resource.cls === "file_bucket"))
            .then(item => item.map(item => ({
                key: item.resource.id,
                label: (
                    <a target="_self" rel="noopener noreferrer" href={routeURL("resource.show", item.resource.id)}>
                        {item.resource.display_name}
                    </a>
                ),

            })))
            .then(itm => {
                const obj = {
                    href: href,
                    title: (
                        <span className="title-item">
                            <SvgIcon icon={icon} />
                            <span className="title">{title}</span>
                        </span>
                    ),
                }
                itm.length > 1 && Object.assign(obj, {
                    menu: {
                        className: "dropdown-items",

                        items: itm.filter(i => i.key !== current_id)
                    },
                });
                setValue(prev => ({
                    ...prev,
                    [String(id)]: obj
                }))
            })
    }

    useMemo(() => {
        bcpath?.map(item => {
            return getCollection(item)
        })
    }, []);

    return (
        <div className="ngw-breabcrumb-panel ">
            <Breadcrumb items={Object.values(value)} />
        </div>
    )
};

BreadcrumbComponent.displayName = "BreadcrumbComponent";