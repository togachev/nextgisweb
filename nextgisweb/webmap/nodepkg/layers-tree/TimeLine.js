import { Slider, Card } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLine.less";
import ParseDesc from "./ParseDesc"

export function TimeLine({
    nodeData,
    timeLineClickId,
    setTimeLineClickId
}) {
    const { id } = nodeData;

    if (timeLineClickId === undefined || timeLineClickId !== id) {
        return (
            <span title="Описание" className="more"
                onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                <HistoryOutlined />
            </span>
        );
    }
    const menuProps = {
        items: [{
            key: nodeData.id,
            label: (
                <Card
                    bordered={false}
                    style={{
                        width: 350,
                    }}
                >
                    <ParseDesc item={nodeData} />
                </Card>
            )
        }],
    };

    const onOpenChange = () => {
        setTimeLineClickId(undefined);
    };

    return (
        <div className="timeline-block">
            <Slider
                range={{
                    draggableTrack: true
                }}
                min={Math.floor(new Date("2023.10.01").valueOf() / 1000)}
                max={Math.floor(new Date("2023.10.31").valueOf() / 1000)}
                defaultValue={[
                    Math.floor(new Date("2023.10.02").valueOf() / 1000),
                    Math.floor(new Date("2023.10.16").valueOf() / 1000)
                ]}
                onChange={(item) => {
                    let dateMin = new Date(item[0] * 1000).toLocaleDateString('en-US');
                    let dateMax = new Date(item[1] * 1000).toLocaleDateString('en-US');
                    console.log(dateMin, dateMax);
                }}
            />
        </div>
    );
}