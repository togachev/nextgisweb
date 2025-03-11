import { useMemo } from "react";
import { Breadcrumb } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";

import "./BreadcrumbComponent.less";

interface BreadcrumbProps {
    href?: string;
    icon?: string;
    title?: string;
}

interface BreadcrumbComponentProps {
    bcpath?: BreadcrumbProps[];
}

export const BreadcrumbComponent = ({ bcpath }: BreadcrumbComponentProps) => {
    console.log(bcpath);
    
    const items: BreadcrumbProps[] = useMemo(() => {
        return bcpath?.map(item => {
            return {
                href: item.href,
                title: (
                    <span className="title-item">
                        <SvgIcon icon={item.icon} />
                        <span className="title">{item.title}</span>
                    </span>
                ),
            }
        })
    }, [bcpath]);


    return (
        <div className="ngw-breabcrumb-panel ">
            <Breadcrumb separator=">" items={items} />
        </div>
    )
};

BreadcrumbComponent.displayName = "BreadcrumbComponent";