import "./ResourceTitle.less";

interface ResourceTitleProps {
    title?: string;
}

export const ResourceTitle = ({ title }: ResourceTitleProps) => {
    return (
        <div className="title-resource-component">
            <div className="title-resource" title={title} >{title}</div>
        </div>
    );
};

ResourceTitle.displayName = "ResourceTitle";