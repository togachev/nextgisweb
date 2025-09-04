import { useState } from "react";
import { Button, Col, Dropdown, Row } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { getEntries } from "@nextgisweb/webmap/popup/util/function";
import Paperclip from "@nextgisweb/icon/mdi/paperclip";
import Download from "@nextgisweb/icon/mdi/download";
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

    const handleMenuClick: MenuProps["onClick"] = () => {
        setOpen(false);
    };

    const handleOpenChange: DropdownProps["onOpenChange"] = (nextOpen, info) => {
        if (info.source === "trigger" || nextOpen) {
            setOpen(nextOpen);
        }
    };

    const { data: data } = useRouteGet("file_resource.group_show", { id: nodeData.styleId });

    const items: MenuProps["items"] = [];
    if (data) {
        getEntries(data).map(([_, itm]) => {
            itm.map((i: FileProps) => {
                items.push({
                    key: i.id,
                    label: (
                        <Row align="middle">
                            <Col flex="auto">
                                <Button className="title-file" title={i.name} target="_blank" href={i.link} type="text">
                                    <span className="linkFile">
                                        <sub className="fileTitle">{i.res_name}</sub>
                                        <span className="fileName">{i.name}</span>
                                    </span>
                                </Button>
                            </Col>
                            <Col flex="24px">
                                <Button className="dowload-file" icon={<Download />} title={gettext("Download")} target="_blank" href={i.link} type="text" download />
                            </Col>
                        </Row>
                    ),
                })
            })
        })
    }



    return items.length > 0 && (
        <Dropdown
            menu={{
                items,
                onClick: handleMenuClick,
            }}
            trigger={["click"]}
            onOpenChange={handleOpenChange}
            open={open}
            destroyOnHidden
            popupRender={(menu) => (
                <div className="dropdown-file">
                    {menu}
                </div>
            )}
        >
            <Button
                title={DownloadAttachedFiles}
                className="more"
                size="small"
                type="text"
                icon={<Paperclip style={{ rotate: "45deg" }} />}
                onClick={(e) => { e.stopPropagation(); }}
            />
        </Dropdown>
    );
}