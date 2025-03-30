import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Col, Form, message, Row, Upload, Space, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import FileArrowUpDownOutline from "@nextgisweb/icon/mdi/file-arrow-up-down-outline";
import { HomeStore } from "../HomeStore";
import type { GetProp, UploadProps } from "@nextgisweb/gui/antd";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

export const UploadComponent = observer(({ store: storeProp, params }) => {

    const [store] = useState(
        () => storeProp || new HomeStore()
    );
    const { size, extension, key, type, formatName, className, styleImage, values, setValues } = params;

    const TYPE_FILE = [
        {
            label: formatName,
            title: formatName,
            value: type,
            extension: extension,
            disabled: false,
        },
    ];

    const getBase64 = (file: FileType): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file as Blob);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const props: UploadProps = useMemo(() => ({
        defaultFileList: store[values]?.[key]?.status === "done" && [store[values]?.[key]],
        multiple: false,
        customRequest: async (options) => {
            const { onSuccess, onError, file } = options;
            try {
                if (!file.preview) {
                    file.preview = await getBase64(file);
                    const value = {
                        ...store[values],
                        [key]: file,
                    };

                    store[setValues](value);
                }
                if (onSuccess) {
                    onSuccess("Ok");
                }
            } catch (err) {
                if (onError) {
                    onError(new Error("Exception download"));
                }
            }
        },
        beforeUpload: (file, info) => {
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
        },
        showUploadList: {
            showDownloadIcon: false,
            showRemoveIcon: true,
            removeIcon: <DeleteOffOutline />,
        },
        itemRender: (originNode, file) => {
            return (
                <Space direction="horizontal">
                    <Tooltip
                        title={file.name + ", " + (file.size / 1024).toFixed(2) + "KB"}
                        trigger={["click", "hover"]}
                    >
                        <img style={styleImage} className="custom-image" src={file.preview} />
                    </Tooltip >
                    {originNode.props.children.filter(item => ["download-delete"].includes(item.key))}
                </Space>
            )
        },
        maxCount: 1,
        onRemove: (file) => {
            const value = {
                ...store[values],
                [file]: {},
            };
            store[setValues](value);
        }
    }), [store]);

    const msgInfo = [
        gettext(`Supported file format ${formatName}.`),
        gettext(`Maximum file size ${size}KB.`),
    ];

    const normalizingFileUpload = (event) => {
        if (Array.isArray(event)) {
            return;
        }
        return event && {
            preview: event.file.preview,
            name: event.file.name,
            uid: event.file.uid,
            type: event.file.type,
            status: event.file.status,
            size: event.file.size,
            response: event.file.response,
            lastModified: event.file.lastModified,
            lastModifiedDate: event.file.lastModifiedDate,
            percent: event.file.percent,
        };
    };

    return (
        <Row gutter={[16, 16]}>
            <Col flex="auto">
                <Form.Item
                    noStyle
                    name={key}
                    valuePropName="file"
                    getValueFromEvent={normalizingFileUpload}
                >
                    <Upload {...props} listType="picture" accept={extension} className={className}>
                        <Tooltip
                            title={msgInfo.join(" ")}
                            trigger={["click", "hover"]}
                        >
                            <Button
                                icon={<FileArrowUpDownOutline />}
                                type="default"
                                title={gettext("Select File")}
                            />
                        </Tooltip>
                    </Upload>
                </Form.Item>
            </Col>
        </Row>
    );
});