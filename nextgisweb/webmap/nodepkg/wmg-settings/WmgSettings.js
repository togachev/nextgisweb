import { useState, useEffect } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { errorModal } from "@nextgisweb/gui/error";
import "./WmgSettings.less";
import Select from 'react-select';
import getSelectStyle from "@nextgisweb/resource/resource-constraint/selectStyle";
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

export function WmgSettings(props) {
    const [items, setItems] = useState([]);
    const [defaultItems, setDefault] = useState([]);
    const [newValue, setNewValue] = useState([]);

    useEffect(() => {
        let isSubscribed = true;
        const getData = async () => {
            const filter = Object.values(props.wmgroup).filter((item) => { return item.id !== 0 })

            const results = Object.values(props.wmgroup).filter((item) => { return item.id !== 0 }).filter(({ id: id1 }) => Object.values(props.group).some(({ id: id2 }) => id2 === id1));

            if (isSubscribed) {
                setItems(filter);
                setDefault(results);
            };
        }
        getData().catch(console.error);
        return () => isSubscribed = false;
    }, [newValue]);

    const createItem = async (e) => {
        try {
            await route("wmgroup.create", props.id, e).get();
        }
        catch (err) {
            errorModal(err);
        }
    }
    const deleteItem = async (e) => {
        try {
            await route("wmgroup.delete", props.id, e).get();
        }
        catch (err) {
            errorModal(err);
        }
    }

    const deleteItems = async () => {
        try {
            await route("wmgroup.delete_all", props.id).get();
        }
        catch (err) {
            errorModal(err);
        }
    }

    const onChange = (value, context) => {
        setDefault(value);
        if (context.action === "remove-value") {
            deleteItem(context.removedValue.id)
        } else if (context.action === "clear") {
            deleteItems()
        } else {
            createItem(context.option.id)
        }
    };

    return (
        <>
            <Select
                key={items}
                getOptionLabel={e => e.webmap_group_name}
                getOptionValue={e => e.id}
                defaultValue={defaultItems}
                options={items}
                onChange={onChange}
                isMulti
                styles={getSelectStyle()}
                components={animatedComponents}
                closeMenuOnSelect={false}
            />
            <br></br>
            <h3>Группы цифровой карты:</h3>
            <div>
                {
                    defaultItems.sort(function (a, b) {
                        return a.id - b.id;
                    }).map((item) => {
                        return (
                            <div key={item.id}>{item.webmap_group_name}</div>
                        )
                    })
                }
            </div>
        </>
    )
}