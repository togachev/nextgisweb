import { createPortal } from "react-dom";
import { Button } from "@nextgisweb/gui/antd";
import { CloseIcon } from "@nextgisweb/gui/icon";
import showModal from "@nextgisweb/gui/showModal";
import { useControls } from "./controls/useControls";
import { useState } from 'react';
import { List, arrayMove } from 'react-movable';
import "./ImageView.less";

const ImagePortal = ({ attribs }) => {
    const { refs } = useControls();
    const [items, setItems] = useState([<img key="img" src={attribs.src} alt="" />]);

    return (
        createPortal(
            <div ref={refs} className="image-portal">
                <div
                    className="mask"
                    onClick={() => {
                        refs.current.remove();
                    }}
                ></div>
                <div className="close-block">
                    <Button
                        className="size-button"
                        type="text"
                        icon={<CloseIcon />}
                        onClick={() => {
                            refs.current.remove();
                        }}
                    />
                </div>
                <div className="controls">
                    <Button
                        className="size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                    <Button
                        className="margin-button size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                    <Button
                        className="margin-button size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                    <Button
                        className="margin-button size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                </div>
                <div className="image-block">
                    <List
                        values={items}
                        onChange={({ oldIndex, newIndex }) =>
                            setItems(arrayMove(items, oldIndex, newIndex))
                        }
                        renderList={({ children, props, isDragged }) => (
                            <div
                                {...props}
                                style={{ padding: 0, cursor: isDragged ? 'grabbing' : undefined }}
                            >
                                {children}
                            </div>
                        )}
                        renderItem={({ value, props, isDragged }) => (
                            <div
                                {...props}
                                key={props.key}
                                style={{
                                    ...props.style,
                                    cursor: isDragged ? 'grabbing' : 'grab',
                                    zIndex: 1081,
                                }}
                            >
                                {value}
                            </div>
                        )}
                    />
                </div>
            </div >,
            document.body
        )
    )
}

export function ImageView(props) {
    const { attribs } = props;

    return (
        <div
            className="preview-image"
            onClick={() => {
                showModal(ImagePortal, {
                    attribs: attribs,
                })
            }}
        >
            <img src={attribs.src} alt="" />
        </div>
    );
}
