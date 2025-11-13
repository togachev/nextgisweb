import { Space } from "@nextgisweb/gui/antd";

interface EmptyProps {
    text: string;
}

export const EmptyComponent = ({ text }: EmptyProps) => <Space>{text}</Space>;