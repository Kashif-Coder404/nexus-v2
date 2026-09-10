const object = {
    key1: "value1",
    name: "value2",
    key3: "value3",
}

for(const key in object){
    console.log(`${key}: ${object[key]}`)
}