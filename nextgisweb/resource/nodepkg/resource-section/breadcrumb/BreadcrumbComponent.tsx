import { useMemo, useState } from "react";
import { Dropdown } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import MenuIcon from "@nextgisweb/icon/mdi/menu";
import ResourceHome from "./icons/resource_home.svg";
import { gettext } from "@nextgisweb/pyramid/i18n";

import "./BreadcrumbComponent.less";

interface BreadcrumbProps {
    href?: string;
    icon?: string;
    title?: string;
    id?: number;
    idx?: number;
}

interface BreadcrumbComponentProps {
    bcpath?: BreadcrumbProps[];
    current_id?: number | undefined;
}

export const BreadcrumbComponent = ({ bcpath, current_id }: BreadcrumbComponentProps) => {
    const [value, setValue] = useState([]);
    const bcItems = getEntries(value);

    const getCollection = async ({ idx, id, href, icon, title }: BreadcrumbProps) => {
        return await route("resource.collection").get({
            query: {
                cls: [],
                parent: id,
                serialization: "resource",
                description: false,
            },
        })
            .then(item => item.map(item => {
                return ({
                    key: item.resource.id,
                    label: (
                        <a title={item.resource.display_name} target="_self" rel="noopener noreferrer" href={routeURL("resource.show", item.resource.id)}>
                            <span className="menu-link-resource">{item.resource.display_name}</span>
                        </a>
                    ),
                    icon: (<span className="icon-menu"><SvgIcon icon={`rescls-${item.resource.cls}`} /></span>)
                })
            }))
            .then(itm => {
                const obj = {
                    idx: idx,
                    id: id,
                    href: href,
                    icon: icon,
                    title: title,
                }
                itm.length > 1 && Object.assign(obj, {
                    items: itm.filter(i => i.key !== current_id)
                });
                setValue(prev => ({
                    ...prev,
                    [String(idx)]: obj
                }))
            })
    }

    useMemo(() => bcpath?.map(item => getCollection(item)), []);

    const TitleBc = (itm) => {
        const { iconHome, title, href, sep, items } = itm;
        return (
            <>
                <a href={href}>
                    <span className="icon-title">{iconHome}</span>
                    <span>{title}</span>

                </a>
                {items &&
                    <Dropdown
                        className="menu-dropdown"
                        trigger="click"
                        size="small"
                        menu={{
                            items,
                            style: {
                                maxWidth: "350px",
                                maxHeight: "250px",
                            }
                        }}
                    >
                        <span title={gettext("Вложенные ресурсы")}>
                            <MenuIcon />
                        </span>
                    </Dropdown>
                }
                {sep}
            </>
        )
    }

    return (
        <div className="ngw-breabcrumb-panel ">
            {bcItems.map(([_, itm], index) => {
                itm.iconHome = index === 0 ? <ResourceHome /> : <SvgIcon icon={itm.icon} />
                itm.sep = index + 1 !== bcItems.length ? <span className="separator"></span> : <></>
                return (
                    <span key={itm.href} className="item-bc">
                        <TitleBc {...itm} />
                    </span>
                )
            })}
        </div>
    )
};

BreadcrumbComponent.displayName = "BreadcrumbComponent";