import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Col, Form, message, Row, Upload, Image, Space, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import FileArrowUpDownOutline from "@nextgisweb/icon/mdi/file-arrow-up-down-outline";
import { HomeStore } from "../HomeStore";
import type { GetProp, UploadFile, UploadProps } from "antd";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

export const UploadComponent = observer(({ store: storeProp, params }) => {
    const [store] = useState(
        () => storeProp || new HomeStore()
    );
    const { size, extension, key, type, formatName, className, styleImage, values } = params;

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(store[values]?.[key]?.url);
    const [files, setFiles] = useState<UploadFile[]>(store[values]?.[key])

    const getBase64 = (file: FileType | Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);

            if (reader.readAsDataURL && file instanceof Blob) {
                reader.readAsDataURL(file);
            }

            reader.onerror = reject;
        });

    const handleChange: UploadProps["onChange"] = async ({ file, fileList: newFileList }) => {
        if (!file.url) {
            file.url = await getBase64(file as FileType);
        }
        setFiles([file]);
    };

    const handlePreview = async (file: UploadFile) => {
        if (!file.url) {
            file.url = await getBase64(file as FileType);
        }

        setPreviewImage(file.url);
        setPreviewOpen(true);
    };
    console.log(files);
    
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

    const props = {
        defaultFileList: files,
        multiple: false,
        onPreview: handlePreview,
        customRequest: customRequest,
        onChange: handleChange,
        maxCount: 1,
        listType: "picture-circle",
        accept: extension,
        action: "/",
    };

    const msgInfo = [
        gettext(`Supported file format ${formatName}.`),
        gettext(`Maximum file size ${size}KB.`),
    ];
    const uploadButton = (
        <button style={{ border: 0, background: "none" }} type="button">
            <FileArrowUpDownOutline />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );
    const normFile = (e) => {
        if (Array.isArray(e)) {
            return e;
        }
        if (e.file.status === "done") {
            return e && [{
                uid: e.file.uid,
                name: e.file.name,
                url: e.file.url,
                status: e.file.status,
            }];
        }
    };
    return (
        <Row gutter={[16, 16]}>
            <Col flex="auto">
                <Form.Item
                    noStyle
                    name={key}
                    valuePropName="picture"
                    getValueFromEvent={normFile}
                >
                    <Upload {...props} >
                        {files?.length > 1 ? null : uploadButton}
                    </Upload>
                </Form.Item>
                {previewImage && (
                    <Image
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
            </Col>
        </Row >
    );
});