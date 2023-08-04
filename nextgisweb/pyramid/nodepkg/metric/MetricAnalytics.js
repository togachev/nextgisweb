import i18n from "@nextgisweb/pyramid/i18n";
import { Select, Input, Checkbox, Divider, Col, Row, message } from "@nextgisweb/gui/antd";
import { useEffect, useState } from "react";
import { LoadingWrapper, SaveButton } from "@nextgisweb/gui/component";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { errorModal } from "@nextgisweb/gui/error";
import { route } from "@nextgisweb/pyramid/api";

import "./MetricAnalytics.less";

const inputIdtext = i18n.gettext("Counter");
const yaLabel = i18n.gettext("Yandex.Metrica");
const glLabel = i18n.gettext("Google Analytics");
const select_a_counter = i18n.gettext("Select a counter");


const saveSuccesText = i18n.gettext("The setting is saved.");
const saveSuccesReloadText = i18n.gettext(
    "Reload the page to get them applied."
);

const CheckboxGroup = Checkbox.Group;

const params = {
    ya: ['webvisor'],
    gl: []
};
const MetricId = (props) => {
    const { onChange } = props;
    const handleChange = (e) => {
        const { value: inputValue } = e.target;
        onChange(inputValue);
    };

    return (
        <Input
          {...props}
          onChange={handleChange}
          placeholder={inputIdtext}
          maxLength={50}
        />
    );
  };

export function MetricAnalytics() {

    const [checkedList, setCheckedList] = useState([]);

    const [opMetric, setOpMetric] = useState();
    const [metricId, setMetricId] = useState(null);
    const [valueMetric, setValueMetric] = useState([]);
    const [status, setStatus] = useState("loading");

    const [metricName, setMetricName] = useState('metric_ya');

    const onChange = (value) => {
        setOpMetric(value);
        setMetricId(null)
        setMetricName('metric_' + value);
    };

    const onChangeCheckbox = (list) => {
        setCheckedList(list);
    };

    const model = 'pyramid.' + metricName
    const { data } = useRouteGet({ name: model });

    useEffect(() => {
        const obj = { id: metricId }
        let tagList = []
        checkedList?.map(item => tagList.push(item));
        setValueMetric(Object.assign(obj, { tags: tagList }));
        setStatus(null);
    }, [metricId, metricName, checkedList]);
    
    useEffect(() => {
        if (data !== undefined && data[metricName] !== null) {
            const val = metricName ? data[metricName] : data;
            setMetricId(val.id);
            setCheckedList(val.tags);
            setStatus(null);
        }
    }, [data]);
    
    const save = async () => {
        setStatus("saving");
        try {
            const json = metricName
                ? { [metricName]: valueMetric || null }
                : valueMetric || null;
            await route(model).put({
                json,
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

    return (
        <>
            <Select
                placeholder={select_a_counter}
                onChange={onChange}
                style={{
                    width: '100%',
                }}
                options={[
                    {
                        value: 'ya',
                        label: yaLabel,
                    },
                    {
                        value: 'gl',
                        label: glLabel,
                    }
                ]}
            />

            {
                opMetric ?
                    (<>
                        <Divider />
                        {
                            opMetric == 'ya' ?
                                (<>
                                    <MetricId value={metricId} onChange={setMetricId}/>
                                    <Row>
                                        <Col flex="auto">
                                            <CheckboxGroup options={params[opMetric]} value={checkedList} onChange={onChangeCheckbox} />
                                        </Col>
                                    </Row>
                                </>) :
                                <MetricId value={metricId} onChange={setMetricId}/>
                        }
                        <Divider />
                        <Col flex="none">
                            <SaveButton loading={status === "saving"} onClick={save} />
                        </Col>
                    </>) : <></>
            }
        </>
    );
}