import { difference, pull } from "lodash-es";
import { action, autorun, computed, observable, observe, runInAction } from "mobx";
import { useEffect, useMemo } from "react";
import type {
    TreeDataProvider,
    TreeItem,
    TreeItemIndex,
} from "react-complex-tree";
import { route } from "@nextgisweb/pyramid/api";

import { scalarSequnceIndexer } from "@nextgisweb/gui/util";

import type { FocusTableItem, FocusTableStore } from "./type";

export const ROOT_DATA = Symbol("root");
export const ROOT_ITEM = "root";

const SHALLOW = { deep: false };

class ProviderTreeItem<I extends FocusTableItem>
    implements TreeItem<I | typeof ROOT_DATA> {
    index: TreeItemIndex;
    data: I | typeof ROOT_DATA;
    store: FocusTableStore<I>;
    indexer: DataProvider<I>["indexer"];
    isFolder: boolean;
    canMove: boolean = true;

    childrenObservable: I[] | undefined;
    childrenCache: TreeItemIndex[] | undefined;

    constructor(
        index: TreeItemIndex,
        data: I | typeof ROOT_DATA,
        opts: {
            store: FocusTableStore<I>;
            indexer: DataProvider<I>["indexer"];
            rootItem: TreeItemIndex;
        }
    ) {
        this.index = index;
        this.data = data;
        this.store = opts.store;
        this.indexer = opts.indexer;

        const parent = index === opts.rootItem ? null : (data as I);
        this.childrenObservable = this.store.getItemChildren(parent);
        this.isFolder = Boolean(this.childrenObservable);
    }

    get children() {
        if (this.childrenObservable === undefined) return undefined;
        if (this.childrenCache === undefined) {
            this.childrenCache = this.childrenObservable?.map((data) => {
                return this.indexer.index(data);
            });
        }
        return this.childrenCache;
    }
}

interface DataProviderOpts<I extends FocusTableItem> {
    store: FocusTableStore<I>;
    rootItem: TreeItemIndex;
}

export class DataProvider<I extends FocusTableItem>
    implements TreeDataProvider<I | typeof ROOT_DATA> {
    store: FocusTableStore<I>;
    indexer = scalarSequnceIndexer<I, TreeItemIndex>();
    rootItem: TreeItemIndex;

    private treeItems = observable.map<TreeItemIndex, ProviderTreeItem<I>>();
    private updated = observable.box(new Map<TreeItemIndex, number>(), SHALLOW);
    private listeners: ((ids: TreeItemIndex[]) => void)[] = [];

    cleanupReaction: (() => void) | undefined = undefined;
    cleanupItem = new Map<TreeItemIndex, () => void>();

    constructor(props: DataProviderOpts<I>) {
        this.store = props.store;
        this.rootItem = props.rootItem;
    }

    async getIndex(id) {
        const resp = await route("webmap.item", { id: id }).get();
        return resp;
    };

    startup() {
        this.cleanupReaction = autorun(() => {
            const collected = this.updated.get();
            const updated: TreeItemIndex[] = [];
            const removed: TreeItemIndex[] = [];
            for (const [id, v] of collected) {
                (v >= 0 ? updated : removed).push(id);
                const item = this.treeItems.get(id);
                if (item !== undefined) item.childrenCache = undefined;
            }

            if (updated.length > 0) {
                updated.forEach((id) => this.getTreeItem(id));
                this.listeners.forEach((i) => i(updated));
            }

            removed.forEach((i) => {
                this.treeItems.delete(i);
                this.cleanupItem.get(i)?.();
                this.cleanupItem.delete(i);
            });

            collected.clear();
        });
    }

    teardown() {
        this.cleanupReaction?.();
        this.cleanupReaction = undefined;
        this.cleanupItem.forEach((fn) => fn());
        this.cleanupItem.clear();
    }

    // TreeDataProvider

    async getTreeItem(id: TreeItemIndex) {
        const existing = this.treeItems.get(id);
        if (existing !== undefined) return existing;

        let treeItem: ProviderTreeItem<I>;
        if (id === this.rootItem) {
            treeItem = new ProviderTreeItem(id, ROOT_DATA, this);
        } else {
            const data = this.indexer.lookup(id)!;
            treeItem = new ProviderTreeItem(id, data, this);
        }

        this.registerTreeItem(id, treeItem);
        return treeItem;
    }

    onDidChangeTreeData(listener: (ids: TreeItemIndex[]) => void) {
        this.listeners.push(listener);
        return { dispose: () => pull(this.listeners, listener) };
    }

    setExpandedIndex(splice: ProviderTreeItem<I>[], next, children, childrenIds) {

        console.log(splice, next, children, childrenIds);
        

        // const mappedArray = indices.map((key, index) => ({ [key]: data[index] }));
            // childrenIds.map((key, index) => {
            //     if (next[index].itemType === "group" && next[index].groupExpanded === true) {

            //     }
            //     // ({ [key]: next[index] })
            // });


        // items.map((item, index) => {
        //     if (item.itemType === "group") {
        //         const idx = index + 1
        //         if (item.groupExpanded.value === true) {
        //             item.groupExpandedIndex.value = idx
        //         } else {
        //             item.groupExpandedIndex.value = null
        //         }
        //         if (item.children && item.children.length > 0) {
        //             const parentItem = this.treeItems.get(idx)!;
        //             const children = parentItem.childrenObservable!;
        //             console.log(parentItem.childrenCache);
        //             if (parentItem.childrenCache && parentItem.childrenCache.length > 0) {
        //                 const childrenIds = parentItem.childrenCache
        //                 const next = childrenIds.map((i) => this.indexer.lookup(i)!);
        //                 const splice = children.splice(0, children.length, ...(next as I[]));
        //                 this.setExpandedIndex(splice);
        //             }
        //         }
        //     }
        // });

        // if (item.index === "root") {
        //     if (item.childrenCache && item.childrenCache.length > 0) {
        //         item.childrenCache.map(id => {
        //             this.getTreeItem(id)
        //                 .then(item => {
        //                     this.getExpandedTreeItems(item, groups);
        //                 })
        //         })
        //     }
        // } else {
        //     if (item.isFolder) {
        //         groups.push(item);
        //         if (item.childrenCache && item.childrenCache.length > 0) {
        //             item.childrenCache.map(id => {
        //                 this.getTreeItem(id)
        //                     .then(item => {
        //                         this.getExpandedTreeItems(item, groups);
        //                     })
        //             })
        //         }
        //     }
        // }
    }

    async onChangeItemChildren(
        parentId: TreeItemIndex,
        childrenIds: TreeItemIndex[]
    ) {
        const parentItem = this.treeItems.get(parentId)!;
        const children = parentItem.childrenObservable!;

        runInAction(() => {
            const next = childrenIds.map((i) => this.indexer.lookup(i)!);
            const splice = children.splice(0, children.length, ...(next as I[]));
            this.setExpandedIndex(splice, next, childrenIds, children);

            // splice.map((item, index) => {
            //     if (item.itemType === "group") {
            //         if (item.groupExpanded.value === true) {
            //             item.groupExpandedIndex.value = index + 1
            //         } else {
            //             item.groupExpandedIndex.value = null
            //         }
            //         if (item.children)
            //     }
            // });
        });
    }

    // Helpers

    private registerTreeItem(id: TreeItemIndex, item: ProviderTreeItem<I>) {
        const children = item.childrenObservable;
        this.treeItems.set(id, item);
        if (!children) return;

        const itemCleanup = observe(children, (change) => {
            const updated = new Map(this.updated.get());
            const pv = updated.get(id);
            updated.set(id, pv === undefined ? 0 : pv);
            const touch = (arr: I[], v: number) => {
                for (const ti of arr) {
                    const j = this.indexer.index(ti);
                    const c = updated.get(j);
                    updated.set(j, (c === undefined ? 0 : c) + v);
                }
            };

            if (change.type === "splice") {
                const { added, removed } = change;
                touch(difference(added, removed), +1);
                touch(difference(removed, added), -1);
            }
            this.updated.set(updated);
        });
        this.cleanupItem.set(id, itemCleanup);
    }

    @computed
    get isFlat(): boolean {
        const rootItem = this.treeItems.get(this.rootItem);
        if (rootItem === undefined) return false;
        const isChildfree = (i: I) => !this.store.getItemChildren(i);
        return !!rootItem.childrenObservable!.reduce(
            (a, i) => a && isChildfree(i),
            true
        );
    }
}

export function useDataProvider<I extends FocusTableItem>({
    store,
    rootItem,
}: DataProviderOpts<I>) {
    const provider = useMemo(
        () => new DataProvider({ store, rootItem }),
        [store, rootItem]
    );

    useEffect(() => {
        provider.startup();
        return () => provider.teardown();
    }, [provider]);

    return provider;
}
