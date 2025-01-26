import { useEffect, useRef } from "react";

export const useControls = () => {

    const refs = useRef<HTMLDivElement>(null);

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

    
    return { refs };
}