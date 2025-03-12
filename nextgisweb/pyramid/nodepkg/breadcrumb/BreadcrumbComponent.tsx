import { useMemo, useState } from "react";
import { Button, Dropdown } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import MenuIcon from "@nextgisweb/icon/mdi/menu";
import SlashForward from "@nextgisweb/icon/mdi/slash-forward";
import ResourceHome from "./icons/resource_home.svg";
import { gettext } from "@nextgisweb/pyramid/i18n";

import "./BreadcrumbComponent.less";

interface BreadcrumbProps {
    href?: string;
    icon?: string;
    title?: string;
    id?: number;
}

interface BreadcrumbComponentProps {
    bcpath?: BreadcrumbProps[];
    current_id?: number | undefined;
}

export const BreadcrumbComponent = ({ bcpath, current_id }: BreadcrumbComponentProps) => {
    const [value, setValue] = useState([]);
    const bcItems = getEntries(value);

    const getCollection = async ({ id, href, icon, title }: BreadcrumbProps) => {
        return await route("resource.collection_bc").get({
            query: { cls: ["resource_group", "file_bucket"], parent: id },
            cache: true,
        })
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
                    icon: icon,
                    title: title,
                    type: "link",
                }
                itm.length > 1 && Object.assign(obj, {
                    items: itm.filter(i => i.key !== current_id)
                });
                setValue(prev => ({
                    ...prev,
                    [String(id)]: obj
                }))
            })
    }

    useMemo(() => bcpath?.map(item => getCollection(item)), []);

    const DropDownComponent = (itm) => {
        const { items, type } = itm;
        return (
            <Dropdown.Button
                icon={
                    <span className="icon-menu" title={gettext("Вложенные ресурсы")}>
                        <MenuIcon />
                    </span>
                }
                
                trigger="click"
                size="small"
                type={type}
                menu={{ items }}
            >
                <TitleBc {...itm} />
            </Dropdown.Button>)
    }

    const TitleBc = (itm) => {
        const { iconHome, title, href, type } = itm;
        return (
            <Button
                size="small"
                icon={iconHome}
                href={href}
                type={type}
            >
                <span className="title-bc">{title}</span>
            </Button>
        )
    }

    return (
        <div className="ngw-breabcrumb-panel ">
            {bcItems.map(([_, itm], index) => {
                itm.iconHome = (
                    <span className="icon-home">
                        {index === 0 ? <ResourceHome /> : <SvgIcon icon={itm.icon} />}
                    </span>
                );
                return (
                    <div className="item-bc" key={itm.href}>
                        {
                            itm.items ?
                                <DropDownComponent {...itm} /> :
                                <TitleBc {...itm} />
                        }
                        {index + 1 !== bcItems.length ? (
                            <span className="icon-separator"><SlashForward /></span>
                        ) : <></>}
                    </div>
                )
            })}
        </div>
    )
};

BreadcrumbComponent.displayName = "BreadcrumbComponent";