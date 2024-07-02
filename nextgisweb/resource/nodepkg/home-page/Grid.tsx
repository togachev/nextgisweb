import { useState, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Radio, Space } from "@nextgisweb/gui/antd";
import { route } from "@nextgisweb/pyramid/api";
import { MapTile } from "./MapTile";
import { ButtonSave } from "./ButtonSave";

import "./Grid.less";

const Height = 320;

export const GridLayout = (props) => {
	const { store, config } = props;

	const [layout, setlayout] = useState(store.itemsMapsGroup.map(x => (x.position_map_group)))
	const [staticPosition, setStaticPosition] = useState(true);

	const ResponsiveReactGridLayout = useMemo(() => WidthProvider(Responsive), []);

	useMemo(() => {
		setStaticPosition(true)
		setlayout(store.itemsMapsGroup.map(x => (x.position_map_group)))
	}, [store.itemsMapsGroup])

	const updatePosition = async (res_id, wmg_id, pmg) => {
		await route("wmgroup.update", res_id, wmg_id, pmg).get();
	};

	useEffect(() => {
		setlayout((prev) => {
			return prev.map((item) => {
				return { ...item, static: staticPosition };
			});
		});
		if (staticPosition === false) {
			store.setSourceMaps({ coeff: 0.322580645, minWidth: "419px" });
		} else {
			store.setSourceMaps({ coeff: 1, width: "100%" });
		}
	}, [staticPosition]);

	const savePositionMap = () => {
		setStaticPosition(!staticPosition);
		if (staticPosition === false) {
			layout.map(item => {
				const res_id = Number(item.i.split(":")[0]);
				const wmg_id = Number(item.i.split(":")[1]);
				const pmg = {
					i: item.i,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					static: true,
				}
				updatePosition(res_id, wmg_id, JSON.stringify(pmg))
			});
		}
	};

	return (
		<div
			className="map-grid-panel"
			key={store.sourceMaps.coeff}
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			<div className="grid-block">
				{config.isAdministrator === true && (
					<span className="save-button">
						<ButtonSave staticPosition={staticPosition} onClickSave={savePositionMap} />
					</span>
				)}
				<ResponsiveReactGridLayout
					className={staticPosition ? undefined : "layout-map-edit"}
					style={{ minWidth: store.sourceMaps.minWidth }}
					allowOverlap={false}
					compactType={"horizontal"}
					autoSize={true}
					useCSSTransforms={true}
					margin={staticPosition ? [10, 40] : [10, 10]}
					rowHeight={Height * store.sourceMaps.coeff}
					isResizable={false}
					breakpoints={{
						md: 1240 * store.sourceMaps.coeff,
						sm: 930 * store.sourceMaps.coeff,
						xs: 620 * store.sourceMaps.coeff,
						xxs: 0,
					}}
					cols={{ md: 4, sm: 3, xs: 2, xxs: 1 }}
					layouts={{ md: layout }}
					onLayoutChange={(layout) => { !staticPosition && setlayout(layout); }}
					onDragStop={(e) => { setlayout(e); }}
				>
					{layout.map((p, index) => {
						const item = store.itemsMapsGroup?.find(x => x.position_map_group.i === p.i);
						return (
							<div key={p.i} data-grid={p}
								style={{ cursor: !staticPosition ? "move" : "pointer" }}
								className={`block ${staticPosition ? "static" : "edit"}`} >
								<span
									style={{
										height: !staticPosition ? undefined : Height,
										maxHeight: !staticPosition ? Height * store.sourceMaps.coeff : Height,
									}}
									className={staticPosition ? "content-block" : "edit-block"}
								>
									{staticPosition ? (<MapTile config={config} key={index} item={item} />) : item?.display_name}
								</span>
							</div>
						)
					})}
				</ResponsiveReactGridLayout>
			</div>
		</div>
	);
};

export const GridLeftMenu = (props) => {
	const { store, config } = props;
	const [layout, setlayout] = useState(store.groupMapsGrid.map(x => (x.position_group)));
	const [staticPosition, setStaticPosition] = useState(true);
	const [radioValue, setRadioValue] = useState(layout.find(g => g.x === 0 && g.y === 0).i);

	const ResponsiveReactGridLayout = useMemo(() => WidthProvider(Responsive), []);

	useMemo(() => {
		setStaticPosition(true)
		setlayout(store.groupMapsGrid.map(x => (x.position_group)))
		setRadioValue(layout.find(g => g.x === 0 && g.y === 0).i);
	}, [store.groupMapsGrid])

	const updatePosition = async (wmg_name, pos_group) => {
		await route("resource.wmgroup.update_position", wmg_name, pos_group).get();
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
				const position_group = {
					i: item.i,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					static: true,
				}
				updatePosition(item.i, JSON.stringify(position_group))
			});
		}
	};

	const onClickGroupMapsGrid = (webmap_group_name) => {
		store.setItemsMapsGroup(store.listMaps.filter(item => item.webmap_group_name === webmap_group_name));
	}

	return (
		<div
			className="left-menu-panel grid-content"
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			{config.isAdministrator === true && (
				<span className="save-button">
					<ButtonSave staticPosition={staticPosition} onClickSave={savePositionGroup} />
				</span>
			)}
			<Radio.Group onChange={(e) => { setRadioValue(e.target.value) }} value={radioValue}>
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
							return (
								<span
									key={p.i}
									data-grid={p}
									className={`block ${staticPosition ? "static" : "edit"}`}
								>
									<Radio.Button value={p.i} style={{ cursor: !staticPosition ? "move" : "pointer", width: "100%", height: "100%" }}>
										{!staticPosition ?
											(<span className={staticPosition ? "content-block" : "edit-block"}>
												{p.i}
											</span>) :
											(<span
												title={p.i}
												onClick={() => onClickGroupMapsGrid(p.i)}
												disabled={!staticPosition && true}
											>
												<span className={staticPosition ? "content-block" : "edit-block"}>
													{p.i}
												</span>
											</span>)
										}
									</Radio.Button>
								</span>
							)
						})}
					</ResponsiveReactGridLayout>
				</Space>
			</Radio.Group>
		</div>
	);
}