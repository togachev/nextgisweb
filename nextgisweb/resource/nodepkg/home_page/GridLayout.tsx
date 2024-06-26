import React, { useState, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Button, Tooltip, Empty, Typography, Card } from "@nextgisweb/gui/antd";
import "./GridLayout.less";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Edit from "@nextgisweb/icon/material/edit";
import Save from "@nextgisweb/icon/material/save";
import MapIcon from "@nextgisweb/icon/material/map";

const openMap = gettext("открыть карту");

const { Meta } = Card;
const { Text, Link } = Typography;

const editPosition = gettext("Изменить местоположение");
const savePosition = gettext("Сохранить изменения");

const Width = 300;
const Height = 320;

const MapTile = (props) => {
    const { id, display_name, preview_fileobj_id } = props.item;
    const preview = routeURL('resource.preview', id)
    const urlWebmap = routeURL('webmap.display', id)

    return (
        <Card
            style={{
                width: 300,
                margin: 20,
                height: 320
            }}
            hoverable
            cover={preview_fileobj_id ?
                <Link style={{ padding: 0, display: 'contents' }} href={urlWebmap} target="_blank">
                    <div className="img_preview"
                        style={{ background: `url(${preview}) center center / cover no-repeat` }}
                    ></div>
                </Link>
                :
                <Link style={{ padding: 0, display: 'contents' }} href={urlWebmap} target="_blank">
                    <div className="img_preview_none">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                </Link>
            }
        >
            <Meta
                style={{
                    fontWeight: 500,
                    height: 125
                }}
                title={
                    <Tooltip placement="top" title={display_name} >
                        {display_name}
                    </Tooltip>
                }

                description={
                    <Link href={urlWebmap} target="_blank">
                        <Text className="open-map" underline>{openMap}</Text>
                        <span className="icon-open-map"><MapIcon /></span>
                    </Link>
                }
            />
        </Card>
    )
}

export const GridLayout = (props) => {
	const { store, config } = props;
	console.log(config);

	const [layout, setlayout] = useState(store.itemsMapsGroup.map(x => (x.position_map_group)))
	const [staticPosition, setStaticPosition] = useState(true);

	const ResponsiveReactGridLayout = useMemo(() => WidthProvider(Responsive), []);

	useMemo(() => {
		setStaticPosition(true)
		setlayout(store.itemsMapsGroup.map(x => (x.position_map_group)))
	}, [store.itemsMapsGroup])

	const updatePosition = async (res_id, wmg_id, pmg) => {
		await route("wmgroup.update", res_id, wmg_id, pmg).get()
	};

	useEffect(() => {
		setlayout((prev) => {
			return prev.map((item) => {
				return { ...item, static: staticPosition };
			});
		});
		if (staticPosition === false) {
			store.setSource({ coeff: 0.322580645, minWidth: "419px" });
		} else {
			store.setSource({ coeff: 1, width: "100%" });

		}
	}, [staticPosition]);

	const savePositionMap = () => {
		setStaticPosition(!staticPosition);
		layout.map(item => {
			let res_id = Number(item.i.split(":")[0]);
			let wmg_id = Number(item.i.split(":")[1]);
			let pmg = {
				i: item.i,
				x: item.x,
				y: item.y,
				w: item.w,
				h: item.h,
				static: true,
			}
			updatePosition(res_id, wmg_id, JSON.stringify(pmg));
		});
	};

	return (
		<div
			key={store.source.coeff}
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			<div className="grid-block">
				{config.isAdministrator === true && (
					<span className="save-button">
						<Tooltip placement="topLeft" title={staticPosition ? editPosition : savePosition}>
							<Button type="text" icon={staticPosition ? <Edit /> : <Save />} size="small" onClick={savePositionMap} />
						</Tooltip>
					</span>
				)}
				<ResponsiveReactGridLayout
					className={staticPosition ? undefined : "layout-map-edit"}
					style={{
						minWidth: store.source.minWidth,
					}}
					compactType={"horizontal"}
					autoSize={true}
					useCSSTransforms={true}
					margin={staticPosition ? [30, 30] : [5, 5]}
					rowHeight={Height * store.source.coeff}
					isResizable={false}
					breakpoints={{
						md: 1240 * store.source.coeff,
						sm: 930 * store.source.coeff,
						xs: 620 * store.source.coeff,
						xxs: 0,
					}}
					cols={{ md: 4, sm: 3, xs: 2, xxs: 1 }}
					layouts={{ md: layout }}
					onLayoutChange={(layout) => {
						!staticPosition && setlayout(layout);
					}}
					onDragStop={(e) => {
						setlayout(e);
					}}
				>
					{layout.map((p, index) => {
						const item = store.itemsMapsGroup?.find(x => x.position_map_group.i === p.i);
						return (
							<div key={p.i} data-grid={p} className={`block ${staticPosition ? "static" : "edit"}`} >
								<span
									style={{
										width: !staticPosition ? undefined : Width,
										height: !staticPosition ? undefined : Height,
										maxHeight: !staticPosition ? Height * store.source.coeff : Height,
										maxWidth: !staticPosition ? Width * store.source.coeff : Width,
									}}
									className={staticPosition ? "content-block" : "edit-block"}
								>
									{/* {item?.display_name} */}
									<MapTile key={index} item={item} />
								</span>
							</div>
						)
					})}

				</ResponsiveReactGridLayout>

			</div>
		</div>
	);
};
