import { useEffect, useState } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import InfoIcon from "@material-icons/svg/info";
import MapIcon from "@material-icons/svg/map";
import Edit from "@material-icons/svg/edit";
import Lock from "@material-icons/svg/lock";
import Block from "@material-icons/svg/block";
import LockOpen from "@material-icons/svg/lock_open";
import getSelectStyle from "./selectStyle";
import "./map_list.less";
import "./details.less";
import { CaretDownOutlined } from '@ant-design/icons';
import { BackTop } from "@nextgisweb/gui/antd";
import Select from 'react-select';

export function map_list(props) {

    const [items, setItem] = useState([]);
    useEffect(async () => {
        setItem(props.data.webmaps);
    }, [])

    const [editGroup, setEditGroup] = useState([]);
    
    const BlockGroup = <div className="blockGroup" title="Закрытая группа"><Block style={{color: '#F44336'}}/></div>;
    const lockMap = <Lock style={{color: '#F44336'}}/>;
    const openMap = <LockOpen style={{color: '#00C775'}}/>;

    useEffect(async () => {
        const WmgUrl = routeURL("resource.webmap_group");
        if (props.data.user === true) {
            setEditGroup(<a className="edit_wmg" href={WmgUrl}><Edit/></a>);
        } 
    }, [])

    var groupBy = (items, key) => {
        return items.reduce((result, item) => {
            if (item[key] !== 'default value from resources') {
                (result[item[key]] = result[item[key]] || []).push(item);
            }
            return result;
        }, {});
    };
    
    

    var ImageSocialStyle = {
        width: '25%',
        height: '25%',
        transform: 'translate(150%,150%)',
        display: 'inline-block',
    }

    var firstValueSort = 'Открытые данные';

    const [displayName, setValue] = useState('');

    var outPut;

    if (displayName.length !== 0) {
        outPut = displayName;
    } else {
        outPut = items;
    }

    var itemsGroup = groupBy(outPut, 'webmap_group_name');

    const [isOpen, setIsOpen] = useState('');
    
    useEffect(async () => {
        setIsOpen(true);
    }, [])


    return (
        <>
            <Select
                getOptionLabel={(item) => `${item.display_name}: ${item.webmap_group_name}`}
                getOptionValue={item => item.id}
                options={items}
                onChange={e => {setValue(e);}}
                isMulti
                className="filterName stylesSelect"
                styles={getSelectStyle()}
                placeholder="Введите название карты"
            />
            <div className="_group">
                <div className="block_webmap_group">
                    {   
                        Object.keys(itemsGroup).sort((x,y) => { 
                            return x == firstValueSort ? -1 : y == firstValueSort ? 1 : 0; 
                        }).map((key, value) => {
                            var items = itemsGroup[key];

                            var GroupObj = {}
                            if (items.length !== 0) {
                                GroupObj.name = key;
                                GroupObj.action = itemsGroup[key][0].action_map;
                            }

                            return (
                                <details key={value} open={isOpen}>
                                    <summary>
                                        {GroupObj.action ? true : BlockGroup} {/* Если группа закрытая, появится иконка */}
                                        {GroupObj.name} {/* Имя группы */}
                                        {editGroup} {/* Если администратор, то появится кнопка для редактирования */}
                                    </summary>
                                    <div className="webmap_group" key={value}>
                                        <div className="content_webmap_group" >
                                            {
                                                items.map((item, idx) => {

                                                    var ImageSocial;
                                                    if (item.preview_fileobj_id) {
                                                        var Background = '/api/resource/' + item.id + '/preview'
                                                        ImageSocial = <div className="img_preview" style={{ background: `url(${Background}) center center / cover no-repeat` }}></div>
                                                    } else {
                                                        ImageSocial = <div className="img_preview_none "><MapIcon style={ImageSocialStyle} /></div>;
                                                    }

                                                    <div key={idx}>text</div>
                                                    return (
                                                        <div className="itemLink_res"  key={idx} title={item.display_name}>
                                                            <div className="map_img" >
                                                                <a target="_blank" href={'/resource/' + item.id + '/display?panel=layers'}>
                                                                    {ImageSocial}
                                                                </a>
                                                            </div>
                                                            <div className="link_map">
                                                                <span className="icon_list_map">
                                                                    {!item.owner ? lockMap : openMap}
                                                                </span>
                                                                <a className="map_a_res" target="" title={item.display_name} href={'/resource/' + item.id + '/display?panel=layers'}>
                                                                    <span className="map_name">{item.display_name}</span>
                                                                </a>
                                                                <span className="icon_list_map">
                                                                    <a title="Свойства карты" href={'/resource/' + item.id}>
                                                                        <InfoIcon />
                                                                    </a>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                </details>
                            )
                        })
                    }
                </div>
            </div>
            <BackTop>
                <div className="scrollTop"><CaretDownOutlined /></div>
            </BackTop>
        </>
    );
}
