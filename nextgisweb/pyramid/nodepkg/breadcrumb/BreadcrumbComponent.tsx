import { useMemo } from "react";
import { Breadcrumb } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import { route } from "@nextgisweb/pyramid/api";

import "./BreadcrumbComponent.less";

interface BreadcrumbProps {
    href?: string;
    icon?: string;
    title?: string;
    id?: number;
}

interface BreadcrumbComponentProps {
    bcpath?: BreadcrumbProps[];
}

// const menuItems = [
//     {
//         key: '1',
//         label: (
//             <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">
//                 General
//             </a>
//         ),
//     },
//     {
//         key: '2',
//         label: (
//             <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">
//                 Layout
//             </a>
//         ),
//     },
//     {
//         key: '3',
//         label: (
//             <a target="_blank" rel="noopener noreferrer" href="http://www.tmall.com/">
//                 Navigation
//             </a>
//         ),
//     },
// ];

export const BreadcrumbComponent = ({ bcpath }: BreadcrumbComponentProps) => {

    const getCollection = async (parentId) => {
        return await route("resource.collection").get({
            query: { parent: parentId },
        })
            .then(item => item.filter(item => item.resource.cls === "resource_group" || item.resource.cls === "file_bucket"))
            .then(item => item.map(item => ({ key: item.resource.id, label: item.resource.display_name })))
    }
    // { key: item.resource.id, label: item.resource.display_name }
    const items: BreadcrumbProps[] = useMemo(() => {
        const value = bcpath?.map(item => {
            return getCollection(item.id)
                .then(itm => {
                    return {
                        href: item.href,
                        title: (
                            <span className="title-item">
                                <SvgIcon icon={item.icon} />
                                <span className="title">{item.title}</span>
                            </span>
                        ),
                        menu: { items: itm },
                    }
                })
                
        })
        console.log(value);

    }, [bcpath]);


    return (
        <div className="ngw-breabcrumb-panel ">
            <Breadcrumb separator=">" items={items} />
        </div>
    )
};

BreadcrumbComponent.displayName = "BreadcrumbComponent";