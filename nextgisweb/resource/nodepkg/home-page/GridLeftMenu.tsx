import { useState, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Button } from "@nextgisweb/gui/antd";
import Edit from "@nextgisweb/icon/material/edit";
import Save from "@nextgisweb/icon/material/save";
import { route } from "@nextgisweb/pyramid/api";
import "./GridLeftMenu.less";

export const GridLeftMenu = (props) => {
	const { store } = props;
	const [layout, setlayout] = useState(store.groupMapsGrid.map(x => (x.position_group)));
	const [staticPosition, setStaticPosition] = useState(true);

	const ResponsiveReactGridLayout = useMemo(() => WidthProvider(Responsive), []);

	const [source, setSource] = useState({
		coeff: 1,
		width: undefined,
	});

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
		staticPosition === false
			? setSource({ coeff: 1, width: "300px" })
			: setSource({ coeff: 1, width: "300px" });
	}, [staticPosition]);

	const savePositionMap = () => {
		setStaticPosition(!staticPosition);
		if (staticPosition === false) {
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
			const firstValue = layout.find(item => item.x === 0 && item.y === 0);
			const item = store.groupMapsGrid?.find(x => x.position_group.i === firstValue.i);
			store.setDefaultValueMenu(item.webmap_group_name)
		}
	};

	const onClickGroupMapsGrid = (id) => {
		store.setItemsMapsGroup(store.listMaps.filter(item => item.webmap_group_id === parseInt(id)));
	}


	return (
		<div
			className="left-menu-panel grid-content"
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			<div>
				<Button
					type="text"
					icon={staticPosition ? <Edit /> : <Save />}
					size="small"
					onClick={savePositionMap}
				/>
				<ResponsiveReactGridLayout
					style={{
						width: 300,
					}}
					isBounded={false}
					allowOverlap={false}
					autoSize={true}
					// compactType={"vertical"}
					useCSSTransforms={true}
					margin={[10, 10]}
					rowHeight={40}
					isResizable={false}
					breakpoints={{
						xss: 320,
					}}
					cols={{ xss: 1 }}
					layouts={{ xss: layout }}
					onLayoutChange={(layout) => {
						!staticPosition && setlayout(layout);
					}}
				>
					{layout.map((p, index) => {
						const item = store.groupMapsGrid?.find(x => x.position_group.i === p.i);
						return (
							<div
								key={p.i}
								data-grid={p}
								className="block"
								title={item.webmap_group_name}
								onClick={() => onClickGroupMapsGrid(p.i)}
							>
								<span className={staticPosition ? "content-block" : "edit-block"}>
									{item.webmap_group_name}
								</span>
							</div>
						)
					})}
				</ResponsiveReactGridLayout>
			</div>
		</div>
	);
}