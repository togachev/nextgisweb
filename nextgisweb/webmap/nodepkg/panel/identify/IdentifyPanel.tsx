import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";

import type { FeatureItem } from "@nextgisweb/feature-layer/type";
import { Alert } from "@nextgisweb/gui/antd";
import { errorModal, isAbortError } from "@nextgisweb/gui/error";
import { useLoading } from "@nextgisweb/gui/hook/useLoading";
import { executeWithMinDelay } from "@nextgisweb/gui/util/executeWithMinDelay";
import { useAbortController } from "@nextgisweb/pyramid/hook";
import { gettext } from "@nextgisweb/pyramid/i18n";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import topic from "@nextgisweb/webmap/compat/topic";
import { GraphPanel } from "@nextgisweb/webmap/popup/component/GraphPanel";
import type { Display } from "@nextgisweb/webmap/display";
import type { HighlightEvent } from "@nextgisweb/webmap/feature-highlighter/FeatureHighlighter";

import { PanelContainer } from "../component";
import type { PanelPluginWidgetProps } from "../registry";

import { getEntries } from "@nextgisweb/webmap/popup/util/function";

import { CoordinatesSwitcher } from "./CoordinatesSwitcher";
import { FeatureEditButton } from "./FeatureEditButton";
import type IdentifyStore from "./IdentifyStore";
import { FeatureInfoSection } from "./component/FeatureInfoSection";
import { FeatureSelector } from "./component/FeatureSelector";
import { RasterInfoSection } from "./component/RasterInfoSection";
import type {
    FeatureInfo,
    FeatureIdentify,
    IdentifyInfo,
    IdentifyInfoItem,
} from "./identification";
import { identifyInfoToFeaturesInfo } from "./util/identifyInfoToFeaturesInfo";

import "./IdentifyPanel.less";

// prettier-ignore
const msgTipIdent = gettext("To get feature information, click on the map with the left mouse button. Make sure that other tools are turned off.");
const msgLoad = gettext("Retrieving object information...");
const msgNotFound = gettext("No objects were found at the click location.");

const measurementSridSetting = webmapSettings.measurement_srid;

const loadFeatureItem = async (
    display: Display,
    identifyInfo: IdentifyInfo,
    featureInfo: FeatureInfo,
    opt: { signal: AbortSignal }
) => {
    if (display.identify) {
        const featureItem = await executeWithMinDelay(
            display.identify?.highlightFeature(identifyInfo, featureInfo, opt),
            {
                minDelay: 250,
                signal: opt?.signal,
            }
        );
        return featureItem;
    }
};

const isFloat = (num) => {
    return typeof num === 'number' && num % 1 !== 0;
}

const IdentifyPanel = observer<PanelPluginWidgetProps<IdentifyStore>>(
    ({ display, store }) => {
        const [featureInfo, setFeatureInfo] = useState<IdentifyInfoItem>();
        const [featureItem, setFeatureItem] = useState<FeatureItem>();
        const [featuresInfoList, setFeaturesInfoList] = useState<
            IdentifyInfoItem[]
        >([]);
        const [relationInfo, setRelationInfo] = useState<FeatureIdentify>();

        const { trackPromise, isLoading } = useLoading();
        const { makeSignal, abort } = useAbortController();

        const identifyInfo = store.identifyInfo;

        const highlights = featureInfo && getEntries(display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.layerId === featureInfo.layerId)?.[1].itemConfig.layerHighligh;

        const isNotFound =
            identifyInfo && identifyInfo.response.featureCount === 0;

        useEffect(() => {
            if (isNotFound || identifyInfo === undefined) {
                setFeatureInfo(undefined);
                setFeatureItem(undefined);
                setRelationInfo(undefined);
            }
        }, [isNotFound, identifyInfo]);

        const updateFeatureItem = useCallback(
            async (featureInfo: IdentifyInfoItem | undefined) => {
                abort();

                setFeatureItem(undefined);

                if (!featureInfo || featureInfo.type !== "feature_layer") {
                    if (identifyInfo?.point) {
                        const [x, y] = identifyInfo.point;
                        const highlightEvent: HighlightEvent = {
                            coordinates: [x, y],
                            colorsSelectedFeature: display.config.colorsSelectedFeature,
                        };
                        topic.publish("feature.highlight", highlightEvent);
                    } else {
                        topic.publish("feature.unhighlight");
                    }

                    return;
                }
                const signal = makeSignal();

                try {
                    const featureItemLoaded = await trackPromise(
                        loadFeatureItem(display, identifyInfo!, featureInfo, {
                            signal,
                        })
                    );

                    setFeatureItem(featureItemLoaded);
                    const layerResponse = identifyInfo.response[featureInfo?.layerId];
                    const featureResponse = layerResponse?.features[featureInfo.idx];
                    setRelationInfo(featureResponse);

                } catch (err) {
                    if (!isAbortError(err)) {
                        errorModal(err);
                    }
                }
            },
            [abort, makeSignal, trackPromise, display, identifyInfo]
        );

        const onFeatureChange = useCallback(
            (featureInfo: IdentifyInfoItem | undefined) => {
                setFeatureInfo(featureInfo);
                updateFeatureItem(featureInfo);
            },
            [updateFeatureItem]
        );

        useEffect(() => {
            abort();
            if (!identifyInfo) {
                setFeaturesInfoList([]);
            } else {
                const options = identifyInfoToFeaturesInfo(
                    identifyInfo,
                    display
                );
                if (options.length) {
                    let first;
                    if (identifyInfo.selected) {
                        const selected = identifyInfo.selected;
                        const value = String(
                            isFloat(selected.fid) ?
                                "R-" + selected.layerId :
                                selected.layerId + "-" + selected.fid
                        )
                        first = options.find(item => item.value === value);
                    } else {
                        first = options[0];
                    }
                    onFeatureChange(first);
                }

                setFeaturesInfoList(options);
            }
        }, [identifyInfo, display, onFeatureChange, abort]);

        let loadElement = null;
        if (isLoading) {
            loadElement = (
                <div className="load-row">
                    <div className="load">
                        <div>{msgLoad}</div>
                    </div>
                </div>
            );
        }

        let featureInfoSection;
        let rasterInfoSection;
        if (featureInfo) {
            if (featureItem) {
                const measurementSrid =
                    display.config.measureSrsId || measurementSridSetting;

                const opts = display.config.options;
                featureInfoSection = (
                    <FeatureInfoSection
                        display={display}
                        resourceId={featureInfo.layerId}
                        featureItem={featureItem}
                        measurementSrid={measurementSrid}
                        showGeometryInfo={
                            opts["webmap.identification_geometry"]
                        }
                        showAttributes={
                            opts["webmap.identification_attributes"]
                        }
                        attributePanelAction={
                            <FeatureEditButton
                                display={display}
                                resourceId={featureInfo.layerId}
                                featureId={featureItem.id}
                                onUpdate={() => updateFeatureItem(featureInfo)}
                            />
                        }
                        highlights={highlights}
                    />
                );
            }
            const item = identifyInfo?.response[featureInfo.layerId];
            if (item && "color_interpretation" in item) {
                rasterInfoSection = <RasterInfoSection item={item} />;
            }
        }

        let relationElement;
        if (relationInfo?.relation) {
            relationElement = (<GraphPanel item={relationInfo} />);
        }

        return (
            <PanelContainer
                className="ngw-webmap-panel-identify"
                title={store.title}
                close={store.close}
                prolog={
                    !identifyInfo ? (
                        <Alert
                            className="alert"
                            message={msgTipIdent}
                            showIcon={false}
                            type="info"
                            banner
                        />
                    ) : isNotFound ? (
                        <Alert
                            message={msgNotFound}
                            type="warning"
                            showIcon
                            banner
                        />
                    ) : (
                        <FeatureSelector
                            display={display}
                            featureInfo={featureInfo}
                            featureItem={featureItem}
                            featuresInfoList={featuresInfoList}
                            onFeatureChange={onFeatureChange}
                        />
                    )
                }
                epilog={
                    identifyInfo && (
                        <CoordinatesSwitcher
                            display={display}
                            identifyInfo={identifyInfo}
                        />
                    )
                }
                sectionAccent={true}
                components={{
                    prolog: PanelContainer.Unpadded,
                    epilog: PanelContainer.Unpadded,
                }}
            >
                {relationElement}
                {loadElement}
                {featureInfoSection}
                {rasterInfoSection}
            </PanelContainer>
        );
    }
);

IdentifyPanel.displayName = "IdentifyPanel";
export default IdentifyPanel;
