import { useLayoutEffect, useEffect, useRef } from "react";

export const useModal = () => {
    const refPortal = useRef<HTMLDivElement>(null);
    const refContent = useRef<HTMLDivElement>(null);
    const refBlock = useRef<HTMLDivElement>(null);

    const close = (e) => {
        refPortal.current.remove();
        e.stopPropagation();
    }

    useLayoutEffect(() => {
        const onWheel = (e) => e.preventDefault();
        const onWheelContent = (e) => e.preventDefault();
        const onWheelContentScroll = (e) => e.stopPropagation();

        refPortal.current.addEventListener("wheel", onWheel, { passive: false });

        const resizeObserver = new ResizeObserver((entries) => {
            if (refBlock.current.clientHeight - 10 < entries[0].contentRect.height) {
                refContent.current.addEventListener("wheel", onWheelContentScroll, { passive: true });
            } else {
                refContent.current.addEventListener("wheel", onWheelContent, { passive: false });
            }
        });
        resizeObserver.observe(refContent.current);

        return () => {
            refPortal.current.removeEventListener("wheel", onWheel, false);
            refContent.current.removeEventListener("wheel", onWheelContentScroll, true);
            refContent.current.removeEventListener("wheel", onWheelContent, false);
            resizeObserver.disconnect();
        };
    }, [refContent]);


    return { close, refPortal, refBlock, refContent };
}