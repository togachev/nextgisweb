import { RefObject, useCallback, useEffect } from "react";
import { isMobile as isM, useMobileOrientation } from "react-device-detect";

export const useStyleMobile = () => {

    const { isLandscape } = useMobileOrientation()
    useEffect(() => {
        // if (window.innerWidth < 520) {
        //     const headerHomePage = document.querySelector(".header-home-page") as HTMLDivElement;
        //     headerHomePage.style.setProperty("padding", "0px");

        //     const main = document.querySelector(".main") as HTMLDivElement;
        //     main.style.setProperty("margin", "0px");

        //     const footerHomePage = document.querySelector(".footer-home-page") as HTMLDivElement;
        //     footerHomePage.style.setProperty("padding", "0px");

        //     const menuList = document.querySelector(".menu-list") as HTMLDivElement;
        //     menuList.style.setProperty("max-width", "200px");

        //     const menuComponent = document.querySelector(".menu-component") as HTMLDivElement;
        //     const styles = {
        //         padding: 0,
        //         right: 0
        //     };
        //     Object.assign(menuComponent.style, styles);
        // } else {
        //     const headerHomePage = document.querySelector(".header-home-page") as HTMLDivElement;
        //     headerHomePage.style.setProperty("padding", "0 10%");

        //     const main = document.querySelector(".main") as HTMLDivElement;
        //     main.style.setProperty("margin", "0 10%");

        //     const footerHomePage = document.querySelector(".footer-home-page") as HTMLDivElement;
        //     footerHomePage.style.setProperty("padding", "0 10% 0 10%");

        //     const menuList = document.querySelector(".menu-list") as HTMLDivElement;
        //     menuList.style.setProperty("max-width", "280px");

        //     const menuComponent = document.querySelector(".menu-component") as HTMLDivElement;
        //     const styles = {
        //         padding: 0,
        //         right: 0
        //     };
        //     Object.assign(menuComponent.style, styles);
        // }

        if (isM) {
            const headerHomePage = document.querySelector(".header-home-page") as HTMLDivElement;
            headerHomePage.style.setProperty("padding", "0px");

            const main = document.querySelector(".main") as HTMLDivElement;
            main.style.setProperty("margin", "0px");

            const footerHomePage = document.querySelector(".footer-home-page") as HTMLDivElement;
            footerHomePage.style.setProperty("padding", "0px");

            const menuList = document.querySelector(".menu-list") as HTMLDivElement;
            menuList.style.setProperty("max-width", "200px");

            const menuComponent = document.querySelector(".menu-component") as HTMLDivElement;
            const styles = {
                padding: 0,
                right: 0
            };
            Object.assign(menuComponent.style, styles);
            isLandscape ? document.body.style.setProperty("zoom", "100%") : document.body.style.setProperty("zoom", "200%");
        }
    }, [isM, isLandscape, window.innerWidth]);
};