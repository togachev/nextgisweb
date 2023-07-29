import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";

import { useFileUploader } from "@nextgisweb/file-upload";
import { FileUploaderButton } from "@nextgisweb/file-upload/file-uploader";
import { ActionToolbar } from "@nextgisweb/gui/action-toolbar";
import { Button, Image, Input, Table, Upload } from "@nextgisweb/gui/antd";
import { formatSize } from "@nextgisweb/gui/util";
import { routeURL } from "@nextgisweb/pyramid/api";
import i18n from "@nextgisweb/pyramid/i18n";

import { FileReaderImage } from "./component/FileReaderImage";

import type { EditorWidgetProps } from "@nextgisweb/feature-layer/feature-editor/type";
import type { UploaderMeta } from "@nextgisweb/file-upload/file-uploader/type";
import type AttachmentEditorStore from "./AttachmentEditorStore";
import type { DataSource } from "./type";

import DeleteIcon from "@nextgisweb/icon/material/clear";

import "./AttachmentEditor.less";

function isFileImage(file: File) {
    return file && file["type"].split("/")[0] === "image";
}

const AttachmentEditor = observer(
    ({ store }: EditorWidgetProps<DataSource[], AttachmentEditorStore>) => {
        const multiple = true;

        const dataSource = useMemo(() => {
            if (Array.isArray(store.value)) {
                return store.value;
            }
            return [];
        }, [store.value]);

        const onChange = useCallback(
            (meta_: UploaderMeta) => {
                if (!meta_) {
                    return;
                }
                const metaList = Array.isArray(meta_) ? meta_ : [meta_];
                store.append(metaList);
            },
            [store]
        );

        const { props } = useFileUploader({
            openFileDialogOnClick: false,
            onChange,
            multiple,
        });

        const updateField = useCallback(
            (field, row, value) => {
                store.updateItem(row, field, value);
            },
            [store]
        );

        const handleDelete = useCallback(
            (row) => {
                store.deleteItem(row);
            },
            [store]
        );

        const editableField = useCallback(
            (field) =>
                function EditableField(text, row) {
                    return (
                        <Input
                            value={text}
                            onChange={(e) => {
                                updateField(field, row, e.target.value);
                            }}
                        />
                    );
                },
            [updateField]
        );

        const columns = useMemo(
            () => [
                {
                    key: "preview",
                    className: "preview",
                    render: (_, row: DataSource) => {
                        if ("is_image" in row && row.is_image) {
                            const url = routeURL("feature_attachment.image", {
                                id: store.resourceId,
                                fid: store.featureId,
                                aid: row.id,
                            });
                            return (
                                <Image
                                    width={80}
                                    src={`${url}?size=80x80`}
                                    preview={{ src: url }}
                                />
                            );
                        } else if (
                            "_file" in row &&
                            row._file instanceof File &&
                            isFileImage(row._file)
                        ) {
                            return <FileReaderImage file={row._file} />;
                        }
                        return "";
                    },
                },
                {
                    dataIndex: "name",
                    className: "name",
                    title: i18n.gettext("File name"),
                    render: editableField("name"),
                },
                {
                    dataIndex: "size",
                    className: "size",
                    title: i18n.gettext("Size"),
                    render: (text) => formatSize(text),
                },
                {
                    dataIndex: "description",
                    className: "description",
                    title: i18n.gettext("Description"),
                    render: editableField("description"),
                },
                {
                    key: "actions",
                    title: "",
                    render: (_, record) => (
                        <Button
                            onClick={() => handleDelete(record)}
                            type="text"
                            shape="circle"
                            icon={<DeleteIcon />}
                        />
                    ),
                },
            ],
            [editableField, handleDelete, store.featureId, store.resourceId]
        );

        const actions = useMemo(
            () => [
                <FileUploaderButton
                    key="file-uploader-button"
                    multiple={multiple}
                    onChange={onChange}
                />,
            ],
            [multiple, onChange]
        );

        return (
            <div className="ngw-feature-attachment-editor">
                <ActionToolbar actions={actions} actionProps={{}} />
                <Upload {...props}>
                    <Table
                        rowKey={(record: DataSource) =>
                            "file_upload" in record
                                ? record.file_upload.id
                                : record.id
                        }
                        dataSource={dataSource}
                        columns={columns}
                        parentHeight
                        size="small"
                    />
                </Upload>
            </div>
        );
    }
);

export default AttachmentEditor;