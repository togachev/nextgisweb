import type { DojoDisplay } from "../type";
import type OlMap from "ol/Map";
import Overlay from "ol/Overlay.js";
import type OlOverlay from 'ol/Overlay.js';
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./IdentifyModule.less";
import { createRoot } from 'react-dom/client';
import { Component } from 'react';
import { pointClick } from "./icons/icon";
import { createPortal } from 'react-dom';
import { usePointPopup } from "./hook/usePointPopup";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";

const Popup = ({ coordinate, settings }) => {
    return (
        createPortal(
            <div className="popup-position" style={{ border: 'solid #106a90 1px', padding: '5px', borderRadius: '3px', right: '10px', top: '50px', background: '#fff', position: 'absolute', width: settings.popup_width, height: settings.popup_height }}>{coordinate[0]}</div>,
            document.body
        )
    )
}

const PopupContext = ({ event }) => {
    const { positionPopup } = usePointPopup();
    const [ width, height ] = [250, 250];
    const pos = positionPopup(event, width, height)
    const array = [
        { key: 1, title: 'title 1', result: 'content 1' },
        { key: 2, title: 'title 2', result: 'content 2' },
        { key: 3, title: 'title 3', result: 'content 3' },
        { key: 4, title: 'title 4', result: 'content 4' },
    ]

    return (
        createPortal(
            <div className="context-position" style={{ width: width, height: height, left: pos[0] + 'px', top: pos[1] + 'px' }}>
                <span className="context-title">{pos[2]}</span>
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
            document.body
        )
    )
}

export class IdentifyModule extends Component {
    private display: DojoDisplay
    private olmap: OlMap;
    private overlay: OlOverlay;
    private settings: object;
    constructor(props: DojoDisplay) {
        super(props)

        this.display = props;
        this.settings = webmapSettings;
        this.olmap = this.display.map.olMap;
        this.overlay = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.pointPosition();
        this.contextPopup();
        this.olmap.addOverlay(this.overlay);
    }

    setContext = (value: HTMLElement) => {
        this.overlay.setElement(value);
    }

    pointPosition = () => {
        const point = document.createElement("div");
        point.innerHTML = `<span class="icon-position">${pointClick}</span>`;
        const popup = document.createElement("div");
        const root = createRoot(popup);

        this.olmap.on("singleclick", (e) => {
            if (e.dragging) return;
            if (e.type === "singleclick" && e.originalEvent.shiftKey === false && e.originalEvent.ctrlKey === false) {
                this.setContext(point)
                this.overlay.setPosition(e.coordinate);
                root.render(<Popup settings={this.settings} coordinate={e.coordinate} />);
            }
        });
    }

    contextPopup = () => {
        const context = document.createElement("div");
        const root = createRoot(context);
        this.olmap.on("contextmenu", (e) => {
            if (e.dragging) return;
            if (e.type === "contextmenu" && e.originalEvent.shiftKey === false && e.originalEvent.ctrlKey === false) {
                this.setContext(context)

                root.render(<PopupContext event={e} />);
                this.overlay.setPosition(e.coordinate);
            }
            e.preventDefault();
        });
    }
}
