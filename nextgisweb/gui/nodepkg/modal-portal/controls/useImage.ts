import { useEffect, useRef } from "react";

export const useImage = (store) => {
    const refs = useRef<HTMLDivElement>(null);
    const { setPropsImage, propsImage } = store;

    const close = (e) => {
        refs.current.remove();
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
                return { ...prev, ...{ scale: prev.scale + 0.2 } }
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

    useEffect(() => {
        const onWheel = (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                scalePlus(e);
            } else if (e.deltaY > 0) {
                scaleMinus(e);
            }
        }
        refs.current.addEventListener("wheel", onWheel, false);
        return () => {
            refs.current.removeEventListener("wheel", onWheel, false);
        };
    }, []);

    return { close, horizontalRotate, refs, rotateLeft, rotateRight, scalePlus, scaleMinus, verticalRotate };
}