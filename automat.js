
function Automat(table){
	if(new.target !== Automat){
		return new Automat(table);
	}
	
	this.table = table;
	this.lastIndex = 0;
}

Automat.prototype = {
	constructor:Automat,
	exec:function(str){
		const lastIndex = this.lastIndex;
		const table = this.table;
		const len = str.length - 1;
		
		let index = lastIndex - 1;
		let state = 1, lastState;
		while(state!=0 && index<str.length){
			lastState = state;
			++index;
			state = app(table[state], str[index]);
		}
		
		if(index > lastIndex){
			let result = [str.slice(this.lastIndex, index)];
			result.index = lastIndex;
			this.lastIndex = index;
			this.lastState = lastState;
			return result;
		}
		else{
			return [];
		}
	}
}

function app(fun, arg){
	if(typeof fun === 'function'){
		return fun(arg);
	}
	else if(typeof fun === 'object'){
		return fun[arg];
	}
	else{
		return fun;
	}
}

module.exports = Automat;