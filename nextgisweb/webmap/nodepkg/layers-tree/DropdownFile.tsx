import { useState } from "react";
import { Dropdown } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import Paperclip from "@nextgisweb/icon/mdi/paperclip";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import "./DropdownFile.less";

import type { RootItemConfig } from "@nextgisweb/webmap/type/api";
import type { TreeItemConfig } from "../type/TreeItems";
import type { DropdownProps, MenuProps } from "@nextgisweb/gui/antd";

const DownloadAttachedFiles = gettext("Download attached files");

interface FileProps {
    file_bucket_id: number;
    file_resource_id: number;
    fileobj_id: number;
    id: number;
    key: number;
    link: string;
    mime_type: string;
    name: string;
    res_name: string;
    resource_id: number;
    size: string;
}

interface DropdownFileProps {
    nodeData: TreeItemConfig | RootItemConfig;
}

export function DropdownFile({ nodeData }: DropdownFileProps) {
    const [open, setOpen] = useState(false);

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        e.domEvent.stopPropagation();
        setOpen(false);
    };

    const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
        if (info.source === 'trigger' || nextOpen) {
            setOpen(nextOpen);
        }
    };

    const { data: data } = useRouteGet("file_resource.group_show", { id: nodeData.styleId });

    const items: MenuProps["items"] = [];
    data && getEntries(data).map(([_, itm]) => {
        itm.map((i: FileProps) => {
            items.push({
                key: i.id,
                label: (
                    <div className="linkFile" title={i.name}>
                        <a className="a-linkFile" target="_blank" href={i.link} download>
                            <span className="fileTitle">{i.res_name}</span>
                            <span className="fileName">{i.name}</span>
                        </a>
                    </div>
                )
            })
        })
    })

    return (
        <Dropdown
            menu={{
                items,
                onClick: handleMenuClick,
            }}
            trigger={["click"]}
            onOpenChange={handleOpenChange}
            open={open}
        >
            <span
                title={DownloadAttachedFiles}
                className="more"
                onClick={(e) => { e.stopPropagation(); }}
            >
                <Paperclip style={{ rotate: "45deg" }} />
            </span>
        </Dropdown>
    );
}