import { useThemeVariables } from "@nextgisweb/gui/hook";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";

import "./Breadcrumbs.less";

export interface BreadcrumbItem {
    link: string;
    title: string;
    icon: string | null;
}

export interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    const themeVariables = useThemeVariables({
        "theme-color-link-active": "colorLinkActive",
        "theme-color-text-tertiary": "colorTextTertiary",
    });

    if (items.length === 0) return <></>;
    return (
        <div className="ngw-pyramid-layout-breadcrumbs" style={themeVariables}>
            {items.map(({ link, title, icon }, idx) => (
                <span key={idx}>
                    <a href={link}>
                        {icon && <SvgIcon icon={icon} />}
                        {title}
                    </a>
                </span>
            ))}
        </div>
    );
}
