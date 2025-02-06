import { useEffect, useRef } from "react";

export const useImage = (store) => {
    const refPortal = useRef<HTMLDivElement>(null);
    const { propsImage, setPropsImage } = store;

    const close = (e) => {
        refPortal.current.remove();
        e.stopPropagation();
    }

    const rotateLeft = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: { ...prev.transform, rotate: prev.transform.rotate - 90 }
        }));
        e.stopPropagation();
    }

    const rotateRight = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: { ...prev.transform, rotate: prev.transform.rotate + 90 }
        }));
        e.stopPropagation();
    }

    const horizontalRotate = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: { ...prev.transform, rotateX: prev.transform.rotateX + 180 }
        }));
        e.stopPropagation();
    }

    const verticalRotate = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: { ...prev.transform, rotateY: prev.transform.rotateY + 180 }
        }));
        e.stopPropagation();
    }

    const scalePlus = (e) => {
        setPropsImage(prev => {
            if (prev.scale <= 1.6) {
                return {
                    ...prev, ...{
                        scale: prev.scale + 0.2,
                    }
                }
            }
            return prev;
        });
        e.stopPropagation();
    }

    const scaleMinus = (e) => {
        setPropsImage(prev => {
            if (prev.scale >= 0.4) {
                return { ...prev, ...{ scale: prev.scale - 0.2 } }
            }
            return prev;
        });
        e.stopPropagation();
    }
    console.log(propsImage);

    const onScroll = (e) => {
        const delta = e.deltaY * -0.001;
        setPropsImage(prev => {
            const newScale = propsImage.scale + delta;
            const ratio = 1 - newScale / propsImage.scale;

            return {
                ...prev,
                ...{
                    scale: newScale,
                    x: propsImage.x + (e.clientX - propsImage.x) * ratio,
                    y: propsImage.y + (e.clientY - propsImage.y) * ratio,
                }
            }
        });
    };

    // useEffect(() => {
    //     // const onWheel = (e) => {

    //     //     setPropsImage(prev => {
    //     //         if (prev.scale <= 1.6) {
    //     //             e.preventDefault();
    //     //             const delta = e.deltaY * -0.001;
    //     //             const newScale = propsImage.scale + delta;
    //     //             const ratio = 1 - newScale / propsImage.scale;
    //     //             return {
    //     //                 ...prev,
    //     //                 ...{
    //     //                     scale: newScale,
    //     //                     x: prev.x + (e.clientX - prev.x) * ratio,
    //     //                     y: prev.y + (e.clientY - prev.y) * ratio,
    //     //                 }
    //     //             }
    //     //         }
    //     //         return prev;
    //     //     });
    //     // }

    //     refPortal.current.addEventListener("wheel", onScroll, { passive: false });
    //     return () => {
    //         refPortal.current.removeEventListener("wheel", onScroll, false);
    //     };
    // }, []);

    return { onScroll, close, horizontalRotate, refPortal, rotateLeft, rotateRight, scalePlus, scaleMinus, verticalRotate };
}