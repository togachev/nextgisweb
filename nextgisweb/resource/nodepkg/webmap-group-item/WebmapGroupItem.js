import "./WebmapGroupItem.less";

export function WebmapGroupItem(props) {
    
    console.log(props);
    return (
        <> 
            Идентификатор группы: {props.id}
        </>
    );
}