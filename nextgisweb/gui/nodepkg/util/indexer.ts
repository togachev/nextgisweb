type IndexerNode<V, I> = [I | undefined, IndexerMap<V, I>];
type IndexerMap<V, I> = Map<unknown, IndexerNode<V, I>>;
type NonUndefined = NonNullable<unknown> | null;

/** Map array values to some stable value (index) using key function
 *
 * @template V - Type of array
 * @template I - Type of key
 */
export class ArrayIndexer<V extends unknown[], I extends NonUndefined> {
    private readonly vi: IndexerMap<V, I> = new Map();
    private readonly iv: Map<I, V> = new Map();
    private readonly key: (v: V) => I;

    /** Create an instance using the given key function
     *
     * @param key - Function to generate the key, which can be a simple counter
     */
    constructor(key: (v: V) => I) {
        this.key = key;
    }

    /** Get an index for values array
     *
     * Comparison is done on a per-element basis, so passing different array of
     * same values will return the same index value.
     *
     * @param v - Array of values
     * @returns - New or existing key
     */
    index = (v: V): I => {
        let m: IndexerNode<V, I> = [undefined, this.vi];
        for (const p of v) {
            let e = m[1].get(p);
            if (e === undefined) {
                e = [undefined, new Map()];
                m[1].set(p, e);
            }
            m = e;
        }
        if (m[0] === undefined) {
            m[0] = this.key(v);
            this.iv.set(m[0], v);
        }
        return m[0];
    };

    /** Lookup values array by key
     *
     * @param i - Key previously generated by index function
     * @returns - Values array for which the key was generated or undefined
     */
    lookup = (i: I): V | undefined => {
        return this.iv.get(i);
    };
}

/** Wrapper around ArrayIndexer to work with scalar values
 *
 * @template V - Non undefined value to index
 * @template I - Type of key to use
 */
export class ScalarIndexer<V extends NonUndefined, I extends NonUndefined> {
    private readonly target: ArrayIndexer<[V], I>;

    constructor(key: (v: V) => I) {
        this.target = new ArrayIndexer((v) => key(v[0]));
    }

    index = (value: V): I => {
        return this.target.index([value]);
    };

    lookup = (id: I): V | undefined => {
        return this.target.lookup(id)?.[0];
    };
}

function sequence<I>() {
    let acc = 0;
    return () => ++acc as I;
}

/** Create ArrayIndexer instance with sequential numeric keys
 *
 * @template V - Type of array
 * @template I - Type of key
 * @returns ArrayIndexer instance
 *
 * @example
 *
 *     const a1 = [1, 2, 3];
 *     const a2 = [2, 3, 4];
 *     const a3 = [1, 2, 3];
 *
 *     const { index, lookup } = arraySequenceIndexer();
 *
 *     console.assert(index(a1) === 1);  // Starts from 1
 *     console.assert(index(a2) === 2);  // Different values and instance
 *     console.assert(index(a3) === 1);  // Same values as in a1
 *
 *     console.assert(lookup(1) === a1);  // Original array
 *     console.assert(lookup(0) === undefined); // Not found
 */
export function arraySequenceIndexer<
    V extends unknown[],
    I extends NonUndefined | number = number,
>(): ArrayIndexer<V, I> {
    return new ArrayIndexer(sequence());
}

/** Create ScalarIndexer instance with sequential numeric keys
 *
 * @template V - Type of value
 * @template I - Type of key
 * @returns ScalarIndexer instance
 *
 * @example
 *
 *     const o1 = { value: true };
 *     const o2 = { value: false };
 *     const o3 = { value: true };
 *
 *     const { index, lookup } = scalarSequnceIndexer();
 *
 *     console.assert(index(o1) === 1);  // Starts from 1
 *     console.assert(index(o2) === 2);  // Different instance
 *     console.assert(index(o3) === 3);  // Different instance
 *     console.assert(index(o1) === 1);  // Same instance
 *
 *     console.assert(lookup(1) === o1);  // Original array
 *     console.assert(lookup(0) === undefined);  // Undefined
 */
export function scalarSequnceIndexer<
    V extends NonUndefined,
    I extends NonUndefined | number = number,
>(): ScalarIndexer<V, I> {
    return new ScalarIndexer(sequence());
}
