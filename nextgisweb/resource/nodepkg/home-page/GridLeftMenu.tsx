import { useState, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Button, Flex, Radio, Space, Tooltip } from "@nextgisweb/gui/antd";
import Edit from "@nextgisweb/icon/material/edit";
import Save from "@nextgisweb/icon/material/save";
import DragHandle from "@nextgisweb/icon/material/drag_handle";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./GridLeftMenu.less";

const editPosition = gettext("Изменить");
const savePosition = gettext("Сохранить изменения");

export const GridLeftMenu = (props) => {
	const { store, config } = props;
	const [layout, setlayout] = useState(store.groupMapsGrid.map(x => (x.position_group)));
	const [staticPosition, setStaticPosition] = useState(true);

	const ResponsiveReactGridLayout = useMemo(() => WidthProvider(Responsive), []);

	useMemo(() => {
		setStaticPosition(true)
		setlayout(store.groupMapsGrid.map(x => (x.position_group)))
	}, [store.groupMapsGrid])

	const updatePosition = async (wmg_id, position_group) => {
		await route("resource.wmgroup.update_position", wmg_id, position_group).get()
	};

	useEffect(() => {
		setlayout((prev) => {
			return prev.map((item) => {
				return { ...item, static: staticPosition };
			});
		});

		if (staticPosition === false) {
			store.setSourceGroup({ update: false });
		} else {
			store.setSourceGroup({ update: true });
		}

	}, [staticPosition]);

	const savePositionGroup = () => {
		setStaticPosition(!staticPosition);
		if (staticPosition === false) {
			store.setSourceGroup({ update: true });
			layout.map(item => {
				const wmg_id = Number(item.i);
				const position_group = {
					i: item.i,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					static: true,
				}
				updatePosition(wmg_id, JSON.stringify(position_group));
			});
		}
	};

	const onClickGroupMapsGrid = (id) => {
		store.setItemsMapsGroup(store.listMaps.filter(item => item.webmap_group_id === parseInt(id)));
	}
	const [radioValue, setRadioValue] = useState('Apple');

	const onChange3 = (e) => {
		console.log(e);
		//  setRadioValue(value);
	};
	return (
		<div
			className="left-menu-panel grid-content"
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			<div>

				{config.isAdministrator === true && (
					<span className="save-button">
						<Tooltip placement="topLeft" title={staticPosition ? editPosition : savePosition}>
							<Button
								icon={staticPosition ? <Edit /> : <Save />}
								size="small"
								onClick={savePositionGroup}
							/>
						</Tooltip>
					</span>
				)}
				<Radio.Group defaultValue={radioValue} buttonStyle="solid">
					<Space direction="vertical">
						<ResponsiveReactGridLayout
							className={staticPosition ? undefined : "layout-map-edit"}
							style={{
								width: 292,
							}}
							allowOverlap={false}
							autoSize={true}
							useCSSTransforms={true}
							margin={staticPosition ? [10, 10] : [10, 10]}
							rowHeight={40}
							isResizable={false}
							breakpoints={{
								xss: 312,
							}}
							cols={{ xss: 1 }}
							layouts={{ xss: layout }}
							onLayoutChange={(layout) => {
								!staticPosition && setlayout(layout);
							}}
						>
							{layout.map((p) => {
								const item = store.groupMapsGrid.find(x => x.position_group.i === p.i);
								return (
									<span
										key={p.i}
										data-grid={p}
										className={`block ${staticPosition ? "static" : "edit"}`}
									>
										<Radio.Button
											onChange={onChange3} value={p.i}
											style={{
												width: "100%",
												height: "100%",
											}}
										>
											{!staticPosition ?
												(<span className={staticPosition ? "content-block" : "edit-block"}>
													{item.webmap_group_name}
												</span>) :
												(<span
													title={item.webmap_group_name}
													onClick={() => onClickGroupMapsGrid(p.i)}
													disabled={!staticPosition && true}
												>
													<span className={staticPosition ? "content-block" : "edit-block"}>
														{item.webmap_group_name}
													</span>
												</span>)
											}
										</Radio.Button>
									</span>
									// <div
									// 	key={p.i}
									// 	data-grid={p}
									// 	className={`block ${staticPosition ? "static" : "edit"}`}
									// 	title={item.webmap_group_name}
									// 	onClick={() => onClickGroupMapsGrid(p.i)}
									// 	style={!staticPosition && { pointerEvents: "none" }}
									// >
									// 	<span className={staticPosition ? "content-block" : "edit-block"}>
									// 		{item.webmap_group_name}
									// 	</span>
									// </div>
								)
							})}


						</ResponsiveReactGridLayout>				</Space>
				</Radio.Group>
			</div>
		</div>
	);
}