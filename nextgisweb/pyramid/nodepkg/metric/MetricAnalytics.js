import i18n from "@nextgisweb/pyramid/i18n";
import { Input, Checkbox, Divider, Col, Row, message, Tabs } from "@nextgisweb/gui/antd";
import { useEffect, useState } from "react";
import { LoadingWrapper, SaveButton } from "@nextgisweb/gui/component";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { errorModal } from "@nextgisweb/gui/error";
import { route } from "@nextgisweb/pyramid/api";

import "./MetricAnalytics.less";

const inputIdtext = i18n.gettext("Enter ID");
const yaLabel = i18n.gettext("Yandex.Metrica");
const glLabel = i18n.gettext("Google Analytics");


const saveSuccesText = i18n.gettext("The setting is saved.");
const saveSuccesReloadText = i18n.gettext("Reload the page to get them applied.");

const CheckboxGroup = Checkbox.Group;

const params = {
    ya: {
        metric: yaLabel,
        tag: [
            'clickmap',
            'trackLinks',
            'accurateTrackBounce',
            'webvisor'
        ]
    },
    gl: {
        metric: glLabel,
        tag: [
            // 'tag_gl_1', // Add your tags
            // 'tag_gl_2'
        ]
    }
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

const MetricCheckbox = (props) => {
    const { indeterminate, onChange, checked } = props;
    return (
        <Row>
            <Col flex="auto">
                <Checkbox indeterminate={indeterminate}
                    onChange={onChange} checked={checked}>
                    Check all
                </Checkbox>
            </Col>
        </Row>
    );
};

const MetricCheckboxGroup = (props) => {
    const { options, value, onChange } = props;
    return (
        <Row>
            <Col flex="auto">
                <CheckboxGroup options={options}
                    value={value} onChange={onChange} />
            </Col>
        </Row>
    );
};

export function MetricAnalytics() {

    const [metricId, setMetricId] = useState();
    const [valueMetric, setValueMetric] = useState([]);
    const [status, setStatus] = useState("loading");
    const [metricName, setMetricName] = useState('metric_ya');

    const [checkedList, setCheckedList] = useState();
    const [indeterminate, setIndeterminate] = useState(true);
    const [checkAll, setCheckAll] = useState(false);

    const [opMetric, setOpMetric] = useState('ya');

    const model = 'pyramid.' + metricName
    const { data } = useRouteGet({ name: model });

    useEffect(() => {
        if (data !== undefined && data[metricName] !== null) {
            const val = metricName ? data[metricName] : data;
            setMetricId(val.id);
            setCheckedList(val.tags);
            setStatus(null);
        }
    }, [data]);

    const onChange = (value) => {
        setOpMetric(value);
        setCheckedList([])
        setMetricId(null)
        setMetricName('metric_' + value);
    };

    useEffect(() => {
        const obj = { id: metricId }
        let tagList = []
        checkedList?.map(item => tagList.push(item));
        setValueMetric(Object.assign(obj, { tags: tagList }));
        setStatus(null);
    }, [metricId, metricName, checkedList]);

    const save = async () => {
        setStatus("saving");
        try {
            const json = metricName
                ? { [metricName]: valueMetric || null }
                : valueMetric || null;
            console.log(json);
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

    const onChangeCheckbox = (list) => {
        setCheckedList(list);
        setIndeterminate(!!list.length && list.length < params[opMetric].tag.length);
        setCheckAll(list.length === params[opMetric].tag.length);
    };
    const onCheckAllChange = (e) => {
        setCheckedList(e.target.checked ? params[opMetric].tag : []);
        setIndeterminate(false);
        setCheckAll(e.target.checked);
    };

    const items = []
    Object.entries(params).forEach(([key, value]) => {
        const item = {
            label: value.metric,
            key: key,
            children: (
                <>
                    <MetricId value={metricId} onChange={setMetricId} />
                    {
                        params[opMetric].tag.length > 0 ?
                            <>
                                <Divider />
                                <MetricCheckbox
                                    indeterminate={indeterminate}
                                    onChange={onCheckAllChange}
                                    checked={checkAll}
                                />
                                <MetricCheckboxGroup
                                    options={params[opMetric].tag}
                                    value={checkedList}
                                    onChange={onChangeCheckbox}
                                />
                            </>
                            : <></>
                    }
                    <Divider />
                    <SaveButton loading={status === "saving"} onClick={save} />
                </>
            ),
        }
        items.push(item);
    });

    return (
        <>
            <Tabs
                defaultActiveKey="ya"
                onChange={onChange}
                items={items}
            />
        </>
    );
}