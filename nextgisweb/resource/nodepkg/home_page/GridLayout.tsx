import { useState, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Button, Tooltip } from "@nextgisweb/gui/antd";
import "./GridLayout.less";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Edit from "@nextgisweb/icon/material/edit";
import Save from "@nextgisweb/icon/material/save";
import { MapTile } from "./MapTile";

const editPosition = gettext("Изменить местоположение");
const savePosition = gettext("Сохранить изменения");

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
					margin={staticPosition ? [10, 40] : [5, 5]}
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
										height: !staticPosition ? undefined : Height,
										maxHeight: !staticPosition ? Height * store.source.coeff : Height,
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
