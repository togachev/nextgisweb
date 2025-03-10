import "./WebMapTitle.less";

interface WebMapTitleProps {
    title?: string;
}

export const WebMapTitle = ({ title }: WebMapTitleProps) => {
    return (
        <div className="title-resource-component">
            <div className="title-resource" title={title} >{title}</div>
        </div>
    );
};

WebMapTitle.displayName = "WebMapTitle";