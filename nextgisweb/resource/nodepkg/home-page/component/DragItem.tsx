import { forwardRef, CSSProperties } from "react";

export const DragItem = forwardRef<HTMLDivElement, ItemProps>(
    ({ id, isDragging, style, ...props }, ref) => {
        
        const { name, width, height } = props
        const inlineStyles: CSSProperties = {
            transformOrigin: "50% 50%",
            height: height,
            width: width,
            borderRadius: 3,
            cursor: isDragging ? "grabbing" : "grab",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: isDragging
                ? "rgb(63 63 68 / 5%) 0px 2px 0px 2px, rgb(34 33 81 / 15%) 0px 2px 3px 2px"
                : "rgb(63 63 68 / 5%) 0px 0px 0px 1px, rgb(34 33 81 / 15%) 0px 1px 3px 0px",
            transform: isDragging ? "scale(1.05)" : "scale(1)",
            ...style,
        };

        return (
            <div className="drag-title" ref={ref} style={inlineStyles} {...props}>
                <span className="title">{name}</span>
            </div>
        );
    }
);