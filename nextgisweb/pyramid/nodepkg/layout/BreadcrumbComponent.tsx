import { useMemo, useState } from "react";
import { Dropdown } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import MenuIcon from "@nextgisweb/icon/mdi/menu";
import ResourceHome from "./icons/resource_home.svg";
import { gettext } from "@nextgisweb/pyramid/i18n";

import "./BreadcrumbComponent.less";

interface BreadcrumbProps {
    link?: string;
    icon?: string;
    title?: string;
    id?: number;
    idx?: number;
}

interface BreadcrumbComponentProps {
    items?: BreadcrumbProps[];
    current_id?: number | undefined;
}

export function BreadcrumbComponent({ items, current_id }: BreadcrumbComponentProps) {
    const [value, setValue] = useState([]);
    const bcItems = getEntries(value);

    const getCollection = async ({ idx, id, link, icon, title }: BreadcrumbProps) => {
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
                    link: link,
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

    useMemo(() => items?.map(item => getCollection(item)), []);

    const TitleBc = (itm) => {
        const { iconHome, title, link, sep, items } = itm;
        return (
            <>
                <a className="title-bc" href={link} title={title} target="_self"><span className="icon-title">{iconHome}</span>{title}</a>
                {items &&
                    <Dropdown
                        className="menu-dropdown"
                        trigger="click"
                        size="small"
                        menu={{
                            items,
                            style: {
                                maxWidth: 350,
                                maxHeight: 250,
                                scrollbarWidth: "thin",
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
        <div className="ngw-breabcrumb-panel">
            {bcItems.map(([_, itm], index) => {
                itm.iconHome = index === 0 ? <ResourceHome /> : <SvgIcon icon={itm.icon} />
                itm.sep = index + 1 !== bcItems.length ? <span className="separator"></span> : <></>
                return (
                    <span key={index} className="item-bc">
                        <TitleBc {...itm} />
                    </span>
                )
            })}
        </div>
    )
}