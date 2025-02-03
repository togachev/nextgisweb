import { useEffect, useRef, useState } from "react";

export const useControls = (store) => {
    const refs = useRef<HTMLDivElement>(null);
    const { refImg, setRefImg, rotate, setRotate, scale, setScale } = store;

    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const close = (e) => {
        refs.current.remove(); e.stopPropagation();
    }
    const rotateLeft = (e) => {
        setRotate(prev => prev - 90);
        e.stopPropagation();
    }
    const rotateRight = (e) => {
        setRotate(prev => prev + 90);
        e.stopPropagation();
    }
    const horizontalRotate = (e) => {
        setRotateX(prev => prev + 180);
        e.stopPropagation();
    }
    const verticalRotate = (e) => {
        setRotateY(prev => prev + 180);
        e.stopPropagation();
    }

    const scalePlus = (e) => {
        scale <= 1.9 ? setScale(scale + 0.1) : setScale(2)
        e.stopPropagation();
    }

    const scaleMinus = (e) => {
        scale >= 0.1 ? setScale(scale - 0.1) : setScale(0.1)
        e.stopPropagation();
    }

    useEffect(() => {
        if (refImg && refImg.current) {
            setRefImg(prev => {
                prev.current.style.transform = `rotate(${rotate}deg)`;
                return prev;
            })
        }
    }, [rotate]);

    useEffect(() => {
        if (refImg && refImg.current) {
            setRefImg(prev => {
                prev.current.style.transform = `rotateX(${rotateX}deg)`;
                return prev;
            })
        }
    }, [rotateX]);

    useEffect(() => {
        if (refImg && refImg.current) {
            setRefImg(prev => {
                prev.current.style.transform = `rotateY(${rotateY}deg)`;
                return prev;
            })
        }
    }, [rotateY]);

    useEffect(() => {
        if (refImg && refImg.current) {
            setRefImg(prev => {
                prev.current.style.scale = scale;
                return prev;
            })
            if (refs && refs.current) {
                const onWheel = (e) => {
                    e.preventDefault();
                    if (e.deltaY < 0 && scale <= 2) {
                        setScale(scale + 0.1)
                    }
                    if (e.deltaY > 0 && scale >= 0.2) {
                        setScale(scale - 0.1)
                    }
                }

                refs.current.addEventListener("wheel", onWheel, false);
                return () => {
                    refs.current.removeEventListener("wheel", onWheel, false);
                };
            }
        }
    }, [scale]);

    useEffect(() => {
        const handleEsc = (event) => {
            console.log(refImg, refs);
            
            // if (event.key === 'Escape') {
            //     if (refImg === undefined) {
            //         refs.current.remove();
            //     }
            // }
        };

        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

    return { close, horizontalRotate, refs, rotateLeft, rotateRight, scalePlus, scaleMinus, verticalRotate };
}