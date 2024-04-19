import type { DojoDisplay } from "../type";
import type OlMap from "ol/Map";
import Overlay from "ol/Overlay.js";
import type OlOverlay from 'ol/Overlay.js';
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./IdentifyModule.less";
import { createRoot } from 'react-dom/client';
import { Component } from 'react';
import PopupArrow from "./popup_arrow.svg";
import { createPortal } from 'react-dom';

const PointClick = `<svg role="presentation" viewBox="0 0 14 14"><g>
        <path d="m7 0c-3.864 0-7 3.136-7 7s3.136 7 7 7 7-3.136 7-7-3.136-7-7-7" fill="#106a90"/>
        <path d="m7 12.6c-3.094 0-5.6-2.506-5.6-5.6s2.506-5.6 5.6-5.6 5.6 2.506 5.6 5.6-2.506 5.6-5.6 5.6" fill="#fff"/>
        <path d="m7 3.5c-1.932 0-3.5 1.568-3.5 3.5s1.568 3.5 3.5 3.5 3.5-1.568 3.5-3.5-1.568-3.5-3.5-3.5" fill="#ff7b00"/>
        </g></svg>`;

interface ContextContentProp {
    title?: string;
}

const ContextContent = ({ title }: ContextContentProp) => {
    const array = [
        { key: 1, title: 'title 1', result: 'content 1' },
        { key: 2, title: 'title 2', result: 'content 2' },
        { key: 3, title: 'title 3', result: 'content 3' },
        { key: 4, title: 'title 4', result: 'content 4' },
    ]
    return (
        <div className="context-position">
            <span className="icon-position-popup"><PopupArrow /></span>
            <div className="context-title">{title}</div>
            {
                array.map(item => {
                    return (
                        <div className="context-item" key={item.key} onClick={() => { console.log(item.result) }} >
                            <span>{item.title}</span>
                        </div>
                    )
                })
            }
        </div>
    )
}

const Popup = () => {
    return (
        createPortal(
            <div style={{ padding: '5px', borderRadius: '3px', right: '10px', top: '50px', background: '#fff', position: 'absolute', width: 250, height: 250 }}>This child is placed in the document body.</div>,
            document.body
        )
    )
}

export class IdentifyModule extends Component {
    private display: DojoDisplay
    private olmap: OlMap;
    private overlay: OlOverlay;

    constructor(props: DojoDisplay) {
        super(props)

        this.display = props;
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
        point.innerHTML = `<span class="icon-position">${PointClick}</span>`;
        const popup = document.createElement("div");
        const root = createRoot(popup);

        this.olmap.on(["contextmenu", "singleclick"], (e) => {
            if (e.dragging) return;
            if (e.type === "singleclick" && e.originalEvent.shiftKey === false && e.originalEvent.ctrlKey === false) {
                this.setContext(point)
                this.overlay.setPosition(e.coordinate);
                root.render(<Popup />);
            }
        });
    }

    contextPopup = () => {
        const context = document.createElement("div");
        context.title = gettext("Context menu right click map");
        const root = createRoot(context);

        this.olmap.on("contextmenu", (e) => {
            if (e.dragging) return;
            if (e.type === "contextmenu" && e.originalEvent.shiftKey === false && e.originalEvent.ctrlKey === false) {
                this.setContext(context)
                this.overlay.setPosition(e.coordinate);
                root.render(<ContextContent title={context.title} />);
            }
            e.preventDefault();
        });
    }
}
