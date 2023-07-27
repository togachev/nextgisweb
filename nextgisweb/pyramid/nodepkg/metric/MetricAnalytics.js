import i18n from "@nextgisweb/pyramid/i18n";

const test = i18n.gettext("Metrics and analytics, setting up counters");

export function MetricAnalytics() {
  return (
    <>{test}</>
  );
}