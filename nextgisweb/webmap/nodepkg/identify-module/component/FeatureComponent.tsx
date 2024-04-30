import { FC } from 'react';
import { Select } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

export const FeatureComponent: FC = ({ data, store }) => {

    const onChange = (value: string) => {
        let val = data.find(item => item.id === value);
        store.setSelected(val);
    };
    console.log(store.selected);

    return (
        <div className="item-content">
            <div className="item">
                <Select
                    optionFilterProp="children"
                    filterOption={(input, option) => (option?.label ?? '').includes(input)}
                    filterSort={(optionA, optionB) =>
                        (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    showSearch
                    size="small"
                    value={store.selected}
                    style={{ width: '100%' }}
                    onChange={onChange}
                    options={data}
                />
                {Object.keys(store.selected.fields).map((key) => (
                    <div key={key} className="item-fields">
                        <div className="label">{key}</div>
                        <div className="padding-item"></div>
                        <div className="value text-ellipsis" title={store.selected.fields[key]}>{store.selected.fields[key] ? store.selected.fields[key] : gettext("N/A")}</div>
                    </div>
                ))}
            </div>
        </div>
    )
};