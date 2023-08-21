import { Col, Input, message, Row, Checkbox } from "@nextgisweb/gui/antd";
import { LoadingWrapper, SaveButton } from "@nextgisweb/gui/component";
import { errorModal } from "@nextgisweb/gui/error";
import { route } from "@nextgisweb/pyramid/api";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import i18n from "@nextgisweb/pyramid/i18n";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";

const saveSuccesText_ = i18n.gettext("The setting is saved.");
const saveSuccesReloadText_ = i18n.gettext(
    "Reload the page to get them applied."
);

const CheckboxGroup = Checkbox.Group;

export function MetricForm({
    keyMetric,
    model,
    settingName,
    saveSuccesText = saveSuccesText_,
    saveSuccesReloadText = saveSuccesReloadText_,
    inputProps = {},
    checkboxProps = {},
}) {
    const [status, setStatus] = useState("loading");
    const [metricCounter, setMetricCounter] = useState({ counterId: "", tags: [] });

    const { data } = useRouteGet({ name: model }, { key: keyMetric });

    const obj = []
    checkboxProps.tags.forEach((element) => {
        obj.push({ label: i18n.gettext(element), value: element });
    });

    useEffect(() => {
        if (data !== undefined) {
            const val = settingName ? data[settingName] : data;
            setMetricCounter(val);
            setStatus(null);
        }
    }, [data]);

    const save = async () => {
        setStatus("saving");
        try {
            const json = settingName
                ? { [settingName]: metricCounter || null }
                : metricCounter || null;
            await route(model, keyMetric).put({
                json
            });
            if (saveSuccesText) {
                message.success(
                    [saveSuccesText, saveSuccesReloadText]
                        .filter(Boolean)
                        .join(" ")
                );
            }
        } catch (err) {
            errorModal(err);
        } finally {
            setStatus(null);
        }
    };

    if (status === "loading") {
        return <LoadingWrapper rows={1} />;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMetricCounter({ ...metricCounter, [name]: value === '' ? undefined : value });
    }

    const handleChecked = (list) => {
        setMetricCounter({ ...metricCounter, tags: list.length === 0 ? undefined : list });
    }
    return (
        <>
            <Row className="input-counter-id">
                <Col flex="auto">
                    <Input
                        name="counterId"
                        value={metricCounter?.counterId}
                        onChange={handleChange}
                        allowClear
                        {...inputProps}
                    />
                </Col>
            </Row>
            <Row className="input-checkbox">
                <Col flex="auto">
                    <CheckboxGroup
                        options={obj}
                        value={metricCounter?.tags}
                        onChange={handleChecked}
                        {...checkboxProps}
                    />
                </Col>
                <Col>
                    <SaveButton loading={status === "saving"} onClick={save} />
                </Col>
            </Row>
        </>
    );
}

MetricForm.propTypes = {
    keyMetric: PropTypes.string,
    model: PropTypes.string.isRequired,
    settingName: PropTypes.string,
    inputProps: PropTypes.object,
    checkboxProps: PropTypes.object,
    saveSuccesText: PropTypes.string,
};