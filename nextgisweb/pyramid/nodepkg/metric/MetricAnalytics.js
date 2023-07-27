import { SingleSettingForm } from "@nextgisweb/gui/single-setting-form";
import i18n from "@nextgisweb/pyramid/i18n";

const metricSaveText = i18n.gettext("Metrics and analytics, setting up counters is saved");

export function MetricAnalytics() {
    return (
        <SingleSettingForm
            model="pyramid.metric"
            settingName="metric"
            saveSuccesText={metricSaveText}
            inputProps={{ placeholder: "metric code text" }}
        />
    );
}