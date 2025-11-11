import { Empty, Typography } from "@nextgisweb/gui/antd";

interface EmptyProps {
    text: string;
}

export const EmptyComponent = ({ text }: EmptyProps) => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={
    <Typography.Text>
        {text}
    </Typography.Text>
} />;