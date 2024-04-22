import type { DojoDisplay } from "../type";
import type OlMap from "ol/Map";
import Overlay from "ol/Overlay.js";
import type OlOverlay from 'ol/Overlay.js';
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./IdentifyModule.less";
import { createRoot } from 'react-dom/client';
import { Component, createRef, forwardRef, RefObject } from 'react';
import { pointClick, popupPoint } from "./icons/icon";
import { createPortal, unmountComponentAtNode } from 'react-dom';
import { usePointPopup } from "./hook/usePointPopup";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";

const PopupComponent = forwardRef((props, ref) => {
    const { element, coordinate, settings } = props;
    return (
        createPortal(
            <div ref={ref} className="popup-position"
                style={{
                    right: 10,
                    top: 50,
                    width: settings.popup_width,
                    height: settings.popup_height,
                    position: 'absolute'
                }}
            >
                <span className="title">Popup</span>
                <span className="content">{coordinate[0] + ", " + coordinate[1]}</span>
            </div>,
            document.body
        )
    )
});

const PopupContext = ({ element, e }) => {
    const { positionPopup } = usePointPopup();
    const width = 150;
    const height = 150;
    const pos = positionPopup(e, width, height)

    const array = [
        { key: 1, title: 'title 1', result: 'content 1' },
        { key: 2, title: 'title 2', result: 'content 2' },
        { key: 3, title: 'title 3', result: 'content 3' },
        { key: 4, title: 'title 4', result: 'content 4' },
    ]

    return (
        createPortal(
            <div className="context-position" style={{
                width: width,
                height: height,
                left: pos[0],
                top: pos[1],
                position: "absolute",
            }}>
                <span className="context-title">Контекстное меню</span>
                {
                    array.map(item => {
                        return (
                            <div className="context-item" key={item.key} onClick={() => { console.log(item.result) }} >
                                <span>{item.title}</span>
                            </div>
                        )
                    })
                }
            </div>,
            element
        )
    )
}

export class IdentifyModule extends Component {
    private display: DojoDisplay
    private olmap: OlMap;
    private overlay: OlOverlay;
    private settings: object;
    private refPopup: RefObject<HTMLInputElement>;
    constructor(props: DojoDisplay) {
        super(props)

        this.display = props;
        this.settings = webmapSettings;
        this.olmap = this.display.map.olMap;
        this.addOverlay();
        this.position();

        this.refPopup = createRef();
    }

    setValue = (value: HTMLElement) => {
        this.overlay.setElement(value);
    }

    addOverlay = () => {
        this.overlay = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay);
    }

    position = () => {
        const point = document.createElement("div");
        point.innerHTML = `<span class="icon-position">${pointClick}</span>`;
        const popup = document.createElement("div");
        const root_popup = createRoot(popup);

        this.olmap.on(["singleclick", "contextmenu"], (e) => {
            if (e.dragging) return;
            if (e.type === "singleclick" && e.originalEvent.shiftKey === false && e.originalEvent.ctrlKey === false) {
                this.setValue(point);
                root_popup.render(<PopupComponent ref={this.refPopup} element={this.overlay.element} settings={this.settings} coordinate={e.coordinate} />);
                this.overlay.setPosition(e.coordinate);
            }
            if (e.type === "contextmenu" && e.originalEvent.shiftKey === false && e.originalEvent.ctrlKey === false) {
                if (this.refPopup.current) {
                    root_popup.unmount();
                }
                const context = document.createElement("div");
                const root_context = createRoot(context);
                this.setValue(context)
                root_context.render(<PopupContext element={this.overlay.element} coordinate={e.coordinate} e={e} />);
                this.overlay.setPosition(e.coordinate);
                e.preventDefault();
            }
        });
    }
}
