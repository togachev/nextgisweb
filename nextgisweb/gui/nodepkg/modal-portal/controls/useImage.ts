import { useEffect, useRef, useState } from "react";

export const useImage = (store) => {
    const refs = useRef<HTMLDivElement>(null);
    const { setRefImg, setRotate, setScale, setPropsImage, propsImage } = store;
    const { rotate, rotateX, rotateY, scale } = propsImage;
    console.log(propsImage);

    const close = (e) => {
        refs.current.remove(); e.stopPropagation();
    }
    const rotateLeft = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: {
                ...prev.transform,
                rotate: prev.transform.rotate - 90
            }
        }));
        e.stopPropagation();
    }

    const rotateRight = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: {
                ...prev.transform,
                rotate: prev.transform.rotate + 90
            }
        }));
        e.stopPropagation();
    }

    const horizontalRotate = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: {
                ...prev.transform,
                rotateX: prev.transform.rotateX + 180
            }
        }));
        e.stopPropagation();
    }

    const verticalRotate = (e) => {
        setPropsImage(prev => ({
            ...prev,
            transform: {
                ...prev.transform,
                rotateY: prev.transform.rotateY + 180
            }
        }));
        e.stopPropagation();
    }

    const scalePlus = (e) => {
        if (scale <= 1.9) {
            setPropsImage(prev => ({
                ...prev,
                ...{ scale: prev.scale + 0.1 }
            }));
        } else {
            setPropsImage(prev => ({
                ...prev,
                ...{ scale: 2 }
            }));
        }
        e.stopPropagation();
    }

    const scaleMinus = (e) => {
        if (scale >= 0.1) {
            setPropsImage(prev => ({
                ...prev,
                ...{ scale: prev.scale - 0.1 }
            }));
        } else {
            setPropsImage(prev => ({
                ...prev,
                ...{ scale: 0.1 }
            }));
        }
        e.stopPropagation();
    }

    // useEffect(() => {
    //     if (refImg && refImg.current) {
    //         setRefImg(prev => {
    //             prev.current.style.transform = `rotate(${rotate}deg)`;
    //             return prev;
    //         })
    //     }
    // }, [rotate]);

    // useEffect(() => {
    //     if (refImg && refImg.current) {
    //         setRefImg(prev => {
    //             prev.current.style.transform = `rotateX(${rotateX}deg)`;
    //             return prev;
    //         })
    //     }
    // }, [rotateX]);

    // useEffect(() => {
    //     if (refImg && refImg.current) {
    //         setRefImg(prev => {
    //             prev.current.style.transform = `rotateY(${rotateY}deg)`;
    //             return prev;
    //         })
    //     }
    // }, [rotateY]);

    // useEffect(() => {
    //     if (refImg && refImg.current) {
    //         setRefImg(prev => {
    //             prev.current.style.scale = scale;
    //             return prev;
    //         })
    //         const onWheel = (e) => {
    //             e.preventDefault();
    //             if (e.deltaY < 0 && scale <= 2) {
    //                 setScale(scale + 0.1)
    //             }
    //             if (e.deltaY > 0 && scale >= 0.2) {
    //                 setScale(scale - 0.1)
    //             }
    //         }

    //         refs.current.addEventListener("wheel", onWheel, false);
    //         return () => {
    //             refs.current.removeEventListener("wheel", onWheel, false);
    //         };
    //     }
    // }, [scale]);

    return { close, horizontalRotate, refs, rotateLeft, rotateRight, scalePlus, scaleMinus, verticalRotate };
}