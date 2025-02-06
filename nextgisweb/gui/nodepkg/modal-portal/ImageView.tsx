import Image from "rc-image";
import { Button } from "@nextgisweb/gui/antd";
import { CloseIcon } from "@nextgisweb/gui/icon";
import RotateLeft from "@nextgisweb/icon/mdi/file-rotate-left-outline";
import RotateRight from "@nextgisweb/icon/mdi/file-rotate-right-outline";
import HorizontalRotate from "@nextgisweb/icon/mdi/horizontal-rotate-clockwise";
import AxisZRotate from "@nextgisweb/icon/mdi/axis-z-rotate-clockwise";
import MagnifyPlus from "@nextgisweb/icon/mdi/magnify-plus-outline";
import MagnifyMinus from "@nextgisweb/icon/mdi/magnify-minus-outline";
import WaterOff from "@nextgisweb/icon/mdi/water-off";

import "./ImageView.less";

export const defaultIcons: PreviewProps['icons'] = {
    rotateLeft: <RotateLeft />,
    rotateRight: <RotateRight />,
    zoomIn: <MagnifyPlus />,
    zoomOut: <MagnifyMinus />,
    close: <CloseIcon />,
    reset: <WaterOff />,
    flipX: <AxisZRotate />,
    flipY: <HorizontalRotate rotate={90} />,
};

export function ImageView(props) {
    const { attribs } = props;

    return (
        <Image
            src={attribs.src}
            preview={{
                icons: defaultIcons,
                toolbarRender: (
                    _,
                    {
                        actions: {
                            onFlipY,
                            onFlipX,
                            onRotateLeft,
                            onRotateRight,
                            onZoomIn,
                            onZoomOut,
                            onClose,
                            onReset,
                        },
                    },
                ) => {
                    return (
                        <div className="controls">
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.flipY} onClick={onFlipY} />
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.flipX} onClick={onFlipX} />
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.rotateLeft} onClick={onRotateLeft} />
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.rotateRight} onClick={onRotateRight} />
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.zoomIn} onClick={onZoomIn} />
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.zoomOut} onClick={onZoomOut} />
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.reset} onClick={() => onReset()} />
                            <Button type="text" className="margin-button size-button" icon={defaultIcons.close} onClick={onClose} />

                        </div>
                    );
                },
            }}
        />);
}
