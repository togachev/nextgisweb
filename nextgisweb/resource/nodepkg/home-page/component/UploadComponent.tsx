import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Form, message, Upload, Image, Space, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import FileArrowUpDownOutline from "@nextgisweb/icon/mdi/file-arrow-up-down-outline";
import Eye from "@nextgisweb/icon/mdi/eye";
import { HomeStore } from "../HomeStore";
import type { GetProp, UploadFile, UploadProps } from "antd";

const { Text } = Typography;

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

export const UploadComponent = observer(({ store: storeProp, params }) => {
    const [store] = useState(() => storeProp || new HomeStore());
    const { size, extension, key, type, formatName, className, values } = params;

    const TYPE_FILE = [
        {
            label: formatName,
            title: formatName,
            value: type,
            extension: extension,
            disabled: false,
        },
    ];

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(store[values]?.[key]?.url);
    const [files, setFiles] = useState<UploadFile[]>(store[values]?.[key]);

    useEffect(() => {
        setFiles(store[values]?.[key])
    }, [store[values]?.[key]]);

    const getBase64 = (file: FileType | Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            if (reader.readAsDataURL && file instanceof Blob) {
                reader.readAsDataURL(file);
            }
            reader.onerror = reject;
        });

    const handleChange: UploadProps["onChange"] = async ({ file, fileList }) => {
        if (!file.url) {
            file.url = await getBase64(file as FileType);
        }

        setFiles(fileList);
    };

    const handlePreview = async (file: UploadFile) => {
        if (!file.url) {
            file.url = await getBase64(file as FileType);
        }

        setPreviewImage(file.url);
        setPreviewOpen(true);
    };

    const customRequest = async options => {
        const { onSuccess, onError, file } = options;
        try {
            if (!file.url) {
                file.url = await getBase64(file as FileType);
            }
            onSuccess("Ok");
        } catch (err) {
            onError({ err });
        }
    };

    const beforeUpload = (file, info) => {
        const fileName = file.name;
        const extension = fileName.slice(fileName.lastIndexOf("."));

        const isValidType = TYPE_FILE.some((e) => e.extension === extension);
        if (!isValidType) {
            message.error(`Only ${formatName} format is supported`);
        }
        const isMaxCount = info.length <= 1;

        const isLimitVolume = file.size / 1024 < size;
        if (!isLimitVolume) {
            message.error(`Exceeding the volume of ${size}kb`);
        }
        return (isValidType && isMaxCount && isLimitVolume) || Upload.LIST_IGNORE;
    };

    const props = {
        defaultFileList: files,
        multiple: false,
        onPreview: handlePreview,
        customRequest: customRequest,
        beforeUpload: beforeUpload,
        onChange: handleChange,
        maxCount: 1,
        listType: "picture",
        accept: extension,
        action: "/upload",
        className: className,
        style: { width: "100%" },
        itemRender: (originNode, file, fileList, actions) => {
            return (
                <Space wrap={true}>
                    <Button
                        className="icon-file"
                        icon={<Eye />}
                        type="default"
                        onClick={actions.preview}
                        title={gettext("Preview file")}
                    />
                    <Button
                        className="icon-file"
                        icon={<DeleteOffOutline />}
                        type="default"
                        onClick={actions.remove}
                        title={gettext("Delete file")}
                    />
                    <Text ellipsis={{ suffix: "", tooltip: true }} >{gettext("File size") + ": " + (file.size / 1024).toFixed(2) + "KB"}</Text>
                    <Text ellipsis={{ suffix: "", tooltip: true }} >{file.name}</Text>
                </Space>
            );
        },
    };

    const msgInfo = [
        gettext("Select File"),
        gettext(`Supported file format ${formatName}.`),
        gettext(`Maximum file size ${size}KB.`),
    ];

    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        if (e.file.status === "done") {
            return e && [{
                uid: e.file.uid,
                name: e.file.name,
                url: e.file.url,
                size: e.file.size,
                status: e.file.status,
            }];
        }
    };

    return (

        <Space wrap style={{
            display: "flex",
        }}>
            <Form.Item
                noStyle
                name={key}
                valuePropName="picture"
                getValueFromEvent={normFile}
            >
                <Upload {...props} style={{ width: "100%" }}>
                    {files?.length > 1 ? null : (
                        <Button
                            icon={<FileArrowUpDownOutline />}
                            type="default"
                            title={msgInfo.join(" \n")}
                        />
                    )}
                </Upload>
            </Form.Item>
            {previewImage && (
                <Image
                    styles={{ mask: { backgroundColor: "transparent" } }}
                    wrapperStyle={{ display: "none" }}
                    preview={{
                        visible: previewOpen,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        afterOpenChange: (visible) => !visible && setPreviewImage(""),
                        transitionName: "",
                        maskTransitionName: "",
                    }}
                    src={previewImage}
                />
            )}
        </Space >
    );
});