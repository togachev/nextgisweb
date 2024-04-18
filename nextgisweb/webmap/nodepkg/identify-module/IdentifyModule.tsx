import type { DojoDisplay } from "../type";
import type OlMap from "ol/Map";
import Overlay from "ol/Overlay.js";
import type OlOverlay from 'ol/Overlay.js';
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./IdentifyModule.less";
import { createRoot } from 'react-dom/client';

const pointClick = `<svg role="presentation" viewBox="0 0 14 14"><g>
        <path d="m7 0c-3.864 0-7 3.136-7 7s3.136 7 7 7 7-3.136 7-7-3.136-7-7-7" fill="#106a90"/>
        <path d="m7 12.6c-3.094 0-5.6-2.506-5.6-5.6s2.506-5.6 5.6-5.6 5.6 2.506 5.6 5.6-2.506 5.6-5.6 5.6" fill="#fff"/>
        <path d="m7 3.5c-1.932 0-3.5 1.568-3.5 3.5s1.568 3.5 3.5 3.5 3.5-1.568 3.5-3.5-1.568-3.5-3.5-3.5" fill="#ff7b00"/>
        </g></svg>`;

const ContextContent = ({ coordinate }) => {
    const coords = coordinate[0] + ", " + coordinate[1]
    const array = [
        { key: 1, title: coords, content: coordinate },
        { key: 2, title: 'title 2', content: 'content 2' },
        { key: 3, title: 'title 3', content: 'content 3' },
        { key: 4, title: 'title 4', content: 'content 4' },
    ]
    return (
        <div className="context-position">
            {
                array.map(item => {
                    return (
                        <div className="context-item" key={item.key} onClick={() => { console.log(item.content) }} >
                            <span>{item.title}</span>
                        </div>
                    )
                })
            }
        </div>
    )
}

export class IdentifyModule {
    private _display: DojoDisplay;
    private _olmap: OlMap;
    private _overlay: OlOverlay;

    constructor(display: DojoDisplay) {
        this._display = display;
        this._olmap = this._display.map.olMap;
        
        this._overlay = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.pointPosition();
        this.contextPopup();
        this._olmap.addOverlay(this._overlay);
    }

    setContext = (value) => {
        this._overlay.setElement(value);
    }

    pointPosition = () => {
        const point = document.createElement("div");
        point.innerHTML = `<span class="icon-position">${pointClick}</span>`;

        this._olmap.on(["contextmenu", "singleclick"], (e) => {
            if (e.dragging) return;
            if (e.type === "singleclick" && e.originalEvent.shiftKey === true && e.originalEvent.ctrlKey === false) {
                this.setContext(point)
                this._overlay.setPosition(e.coordinate);
            }
        });
    }

    contextPopup = () => {

        const context = document.createElement("div");
        context.title = gettext("Context menu right click map");
        const root = createRoot(context);

        this._olmap.on("contextmenu", (e) => {
            if (e.dragging) return;
            if (e.type === "contextmenu" && e.originalEvent.shiftKey === true && e.originalEvent.ctrlKey === false) {
                this.setContext(context)
                this._overlay.setPosition(e.coordinate);
                root.render(<ContextContent coordinate={e.coordinate} />);
            }
            e.preventDefault();
        });
    }
}

