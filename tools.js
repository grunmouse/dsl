
function flatList(item){
	let name = item[0];
	if(item[2] && item[2][0] === name){
		return item.slice(0,2).concat(flatList(item[2]).slice(1));
	}
	else{
		return item;
	}
}

function leftList(arr){
	let name = arr[0];
	return [name, leftList(arr.slice(0,-1), arr.slice(-1)];
}

function rightList(arr){
	let name = arr[0];
	
	return [name, arr[1], rightList([name].concat(arr.slice(2)))];
}

function combine(item){
	if(item.length === 2){
		let [name, arg] = item;
		if(name.indexOf(' ')>0 && arg.length > 2){
			let [inner, ...args] = arg;
			let [op, cl] = name.split(' ');
			return [op+inner+cl, ...args];
		}
	}
	return item;
}