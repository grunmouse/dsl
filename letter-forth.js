const Stack = require('@grunmouse/stack');

const TERMINATOR = Symbol;

function Evaluator(lib){
	
	for(let key of Object.keys(lib)){
		if(typeof key === 'string' && key.length>1){
			for(let s of key.split('')){
				lib[s] = lib[key];
			}
		}
	}
	
	function run(str){
		const stack = new Stack();
		let index = 0;
		
		function eval(s){
			return lib[s](stack, str, index, eval, lib);
		}
		
		while(index<str.length){
			let s = str[index];
			if(s in lib){
				//console.log(s, index);
				index = eval(s);
			}
			else{
				stack.push(s);
				++index;
			}
		}
		if(lib[TERMINATOR]){
			eval(TERMINATOR);
		}
		
		return stack.pop();
	}
	
	return run;
	
}

Evaluator.TERMINATOR = TERMINATOR;

module.exports = Evaluator;