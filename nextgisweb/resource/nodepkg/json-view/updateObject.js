export function updateObject ( keyName, newVal, object ) {
    for (var key in object) {
        key === keyName ? object[key] = newVal :
            typeof object[key] === "object" ? object[key] = updateObject(keyName, newVal, object[key]) :
                typeof object[key] !== "object"
    }
    return object;
}