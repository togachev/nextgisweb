import { useEffect, useRef, useState } from "react";

export const useControls = (store) => {
    const refs = useRef<HTMLDivElement>(null);
    const refImage = useRef<HTMLDivElement>(null);
    const { scale, setScale } = store;

    const [rotate, setRotate] = useState(0);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const close = () => refs.current.remove();
    const rotateLeft = () => setRotate(prev => prev + 90);
    const rotateRight = () => setRotate(prev => prev - 90);
    const horizontalRotate = () => setRotateX(prev => prev + 180);
    const verticalRotate = () => setRotateY(prev => prev + 180);

    useEffect(() => {
        if (refImage.current) {
            refImage.current.style.transform = `rotate(${rotate}deg)`;
        }
    }, [rotate]);

    useEffect(() => {
        if (refImage.current) {
            refImage.current.style.transform = `rotateX(${rotateX}deg)`;
        }
    }, [rotateX]);

    useEffect(() => {
        if (refImage.current) {
            refImage.current.style.transform = `rotateY(${rotateY}deg)`;
        }
    }, [rotateY]);

    useEffect(() => {
        if (refImage.current) {
            refImage.current.style.scale = scale;
        }
    }, [scale]);

    useEffect(() => {
        const onWheel = (e) => {
            if (e.deltaY < 0 && scale <= 2) {
                setScale(scale + 0.1)
            }
            if (e.deltaY > 0 && scale >= 0.2) {
                setScale(scale - 0.1)
            }
        };

        window.addEventListener('wheel', onWheel);

        return () => {
            window.removeEventListener('wheel', onWheel);
        };
    }, [scale]);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                refs.current.remove();
            }
        };

        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);


    return { close, horizontalRotate, refs, refImage, rotateLeft, rotateRight, verticalRotate };
}