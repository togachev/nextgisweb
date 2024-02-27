import { useState, useEffect, useRef } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { errorModal } from "@nextgisweb/gui/error";
import "./WebmapGroupWidget.less";

import SaveOutline from "@nextgisweb/icon/mdi/content-save-outline";
import Add from "@nextgisweb/icon/material/add";
import Delete from "@nextgisweb/icon/material/delete_forever";

import { Input, Radio, Button } from "@nextgisweb/gui/antd";

export function WebmapGroupWidget() {
    
    const [items, setItem] = useState([]);

    const [newValue, setNewValue] = useState(null);

    const [disAdd, setDisAdd] = useState(null);
    const [disSave, setDisSave] = useState(null);
    const [disDel, setDisDel] = useState(null);
    const [activeInput, setActiveInput] = useState(null);

    const [op, setOp] = useState({operation: '', id: null, wmgValue: '', action_map: ''});

    useEffect(() => {
        let isSubscribed = true;
        const getData = async () => {
            const data = await route('resource.mapgroup').get();
            const filter = data.filter((item) => { return item.id !== 0 })
            if (isSubscribed) {
                setItem(filter);
            };
        }
        getData().catch(console.error);
        return () => isSubscribed = false;
    }, [newValue])

    const addNewItem = async () => {
        setItem([...items, { id: '', webmap_group_name: '', action_map: '' }]);
    };

    const delItem = async (id) => {
        try {
            await route("resource.wmgroup.delete", id).get();
            setNewValue(id);
            setDisSave(false);
            setDisDel(false);
        }
        catch (err) {
            errorModal(err);
        }
    }

    const saveItem = async (op) => {
        if (op.operation === 'update') {
            try {
                await route("resource.wmgroup.update", op.id, op.wmgValue, op.action_map).get();
                setNewValue(op.operation);
                setDisAdd(false);
                setDisSave(false);
                setDisDel(false);
            }
            catch (err) {
                errorModal(err);
            } 
            finally {
                setOp({operation: '', id: null, wmgValue: '', action_map: ''})
                
            }
        } else if (op.operation === 'create') {
            try {
                const json = {
                    webmap_group_name: op.wmgValue,
                    action_map: op.action_map,
                };
                await route("resource.wmgroup_create").put({
                    json,
                });
                setNewValue(op.operation);
                setDisAdd(false);
                setDisSave(false);
                setDisDel(false);
            }
            catch (err) {
                errorModal(err);
            }
            finally {
                setOp({operation: '', id: null, wmgValue: '', action_map: ''})
            }
        }
        
    }
    const refWMG = useRef([]);
    const refAction = useRef([]);
    const [active, setActive] = useState(null);

    return (
        <> 
            <div className="wmg_edit_button">
                <Button className="col_button" disabled={disAdd} type="primary" icon={<Add />}
                    onClick={() => {
                        addNewItem();
                        setActive(false);
                        setActiveInput('');
                        setDisAdd(true);
                        setDisSave(true);
                    }}/>
                <Button className="col_button" disabled={!disSave} type="primary" icon={<SaveOutline />}
                    onClick={() => {
                        saveItem(op);
                        setNewValue(null);
                        setActive('');
                        setActiveInput('');
                    }}/>
                <Button className="col_button" disabled={!disDel} type="primary" icon={<Delete />}
                    onClick={() => {
                        delItem(active);
                    }}/>
            </div>
            <div className="wmg_table">
                <div className="detail label-wmg col-alias">
                    <div className="col-id">ID</div>
                    <div className="col-status-alias">Статус</div>
                    <div className="col-name-alias">Группа</div>
                    
                </div>
                {
                    items.sort(function(a, b) {
                        return a.id - b.id;
                    }).map((item) => {

                        return (
                            <div key={item.id} className="detail">
                                <div className="col-1">
                                    <Radio
                                    checked={active===item.id}
                                    onClick={() => {
                                        setActive(item.id);
                                        setActiveInput(item.id);
                                        setDisSave(true);
                                        setDisDel(true);
                                    }}
                                    type="radio" id={item.id}/>
                                </div>

                                <label className="col-id" htmlFor={item.id}>{item.id}</label>
                                <div className="col-status">
                                    <Input
                                        ref={(e) => (refAction.current[item.id] = e)}
                                        
                                        disabled={activeInput!==item.id}
                                        onChange={(e) => {
                                            if (item.id) {
                                                setOp({operation: 'update', id: item.id, wmgValue: refWMG.current[item.id].input.value, action_map: e.target.checked});
                                            } else {
                                                setOp({operation: 'create', id: null, wmgValue: refWMG.current[item.id].input.value, action_map: e.target.checked});
                                            }
                                        }}
                                        type="checkbox"
                                        defaultChecked={item.action_map}
                                    />
                                </div>
                                <div className="col-name">
                                    
                                        <Input
                                            ref={(e) => (refWMG.current[item.id] = e)}
                                            className="col-name col-input-text"
                                            disabled={activeInput!==item.id}
                                            onChange={(e) => {
                                                if (item.id) {
                                                    setOp({operation: 'update', id: item.id, wmgValue: e.target.value, action_map: refAction.current[item.id].input.checked});
                                                } else {
                                                    setOp({operation: 'create', id: null, wmgValue: e.target.value, action_map: refAction.current[item.id].input.checked});
                                                }
                                            }}
                                            type="text"
                                            defaultValue={item.webmap_group_name}
                                        />
                                </div>
                            </div>
                        )
                    })
                }
            </div>
            <h2>Примечание:</h2>
            <p>Группа с включенным статусом доступна для просмотра неавторизованному пользователю.</p>
        </>
    );
}


