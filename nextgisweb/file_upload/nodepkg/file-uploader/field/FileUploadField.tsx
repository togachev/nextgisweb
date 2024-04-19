import type { FormItemProps } from "@nextgisweb/gui/fields-form";
import { FormItem } from "@nextgisweb/gui/fields-form/field/_FormItem";

import { FileUploader } from "../FileUploader";
import type { FileUploaderProps, UploaderMeta } from "../type";

interface FileUploaderFieldProps extends FileUploaderProps {
    value: UploaderMeta;
    onChange: (val?: UploaderMeta) => void;
}

function FileUploader_({
    value,
    onChange,
    ...inputProps
}: FileUploaderFieldProps) {
    return (
        <FileUploader
            style={{ width: "100%", color: "red" }}
            fileMeta={value}
            onChange={(e) => {
                onChange(e);
            }}
            {...inputProps}
        />
    );
}

export function FileUploadField(props: FormItemProps<FileUploaderFieldProps>) {
    return (
        <FormItem
            {...props}
            input={(inputProps) => <FileUploader_ {...inputProps} />}
        />
    );
}
