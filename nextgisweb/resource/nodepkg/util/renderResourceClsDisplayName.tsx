import { SvgIcon } from "@nextgisweb/gui/svg-icon";
import type { ResourceCls } from "@nextgisweb/resource/type/api";

export function renderResourceClsDisplayName({
    name,
    cls,
    cls_display_name,
}: {
    name: React.ReactNode;
    cls: ResourceCls;
    cls_display_name: string;
}) {
    return (
        <div className="content">
            <div className="icon-cls"><SvgIcon icon={`rescls-${cls}`} /></div>
            <div className="name">
                <div title={name} className="value">{name}</div>
                <div className="cls">{cls_display_name}</div>
            </div>
        </div>
    );
}
