import { useState, useEffect } from "react";
import { Dropdown } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import Paperclip from "@nextgisweb/icon/mdi/paperclip";

import "./DropdownFile.less";
import { route } from "@nextgisweb/pyramid/api";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";

import type { MenuProps } from "@nextgisweb/gui/antd";

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

export function DropdownFile({
    nodeData,
    fileClickId,
    setFileClickId,
}) {
    const { id, type } = nodeData;
    const [value, setValue] = useState([]);

    useEffect(() => {
        let isSubscribed = true;
        const getData = async () => {
            if (nodeData.type === 'layer') {
                const value = await route("file_resource.group_show", nodeData.styleId).get();
                if (isSubscribed) {
                    let files: FileProps[] = [];
                    getEntries(value).map(([_, itm]) => {
                        files.push(itm[0])
                    })
                    setValue(files);
                }
            }
        }
        getData().catch(console.error);
        return () => isSubscribed = false;
    }, []);

    if (type === "root" || type === "group" || value.length === 0) {
        return <></>;
    }
    if (fileClickId === undefined || fileClickId !== id) {
        return (
            <span
                title={DownloadAttachedFiles}
                className="more"
                onClick={(e) => {
                    setFileClickId(id);
                    e.stopPropagation();
                }}
            >
                <Paperclip style={{ rotate: "45deg" }} />
            </span>
        );
    }
    
    const menuItems: MenuProps["items"] = [];
    value.length !== 0 && value.map((i) => {
        menuItems.push({
            key: i.id,
            label: (
                <>
                    <div className="linkFile" title={i.name}>
                        <a className="a-linkFile" target="_blank" href={i.link} download>
                            <span className="fileTitle">{i.res_name}</span>
                            <span className="fileName">{i.name}</span>
                        </a>
                    </div>
                </>
            )
        })
    })

    const menuProps = {
        items: menuItems,
    };

    return (
        <>
            {value.length !== 0 && (<Dropdown
                menu={menuProps}
                onOpenChange={() => {
                    setFileClickId(undefined);
                }}
                trigger={["click"]}
                open
                dropdownRender={(menu) => (
                    <div className="dropdown-content customFile" onClick={(e) => { e.stopPropagation(); }}>
                        {menu}
                    </div>
                )}
            >
                <span
                    title={DownloadAttachedFiles}
                    className="more"
                    onClick={(e) => { e.stopPropagation(); }}
                >
                    <Paperclip style={{ rotate: "45deg" }} />
                </span>
            </Dropdown>)}
        </>
    );
}