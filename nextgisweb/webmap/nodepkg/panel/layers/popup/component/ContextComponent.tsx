import { observer } from "mobx-react-lite";
import { forwardRef } from "react";

export default observer(
    forwardRef<Element>(
        function ContextComponent(props, ref) {

            const { pointContextClick, offset, context_width, context_height } = props.store;

            const lonlat = pointContextClick.lonlat.map(number => parseFloat(number.toFixed(6)));
            return (
                <div
                    ref={ref}
                    style={{
                        position: "absolute",
                        top: pointContextClick.clientPixel[1],
                        left: pointContextClick.clientPixel[0],
                        backgroundColor: "#eee",
                        width: context_width,
                        height: context_height,
                        zIndex: 10,
                    }}
                >
                    {lonlat[0]} {lonlat[1]}
                </div>
            )
        }
    )
);