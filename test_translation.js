const parts = "Orange Juice | With Sugar".split(' | ').map(p => p.trim());
console.log(parts);
const key = "With Sugar".toLowerCase().replace(/ /g, '_');
console.log(key);
