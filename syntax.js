const Stack = require('@grunmouse/stack');


function convertTockens(tokens){
	const stack = new Stack();
	for(let item of tokens){
		switch(item.type){
			case 'digit':
			case 'decint':
			case 'hexint':
				item.value = Number(item.value);
				item.type = 'int';
				break;
			case 'hex':
				item.value = parseInt(item.value, 16);
				item.type = 'int';
				break;
			case 'based':
				item.value = parseInt(item.sign + item.value, ite,.based);
				item.type = 'int';
				break;
			case 'float':
				item.value = Number(item.value);
				break;
		}
		
		if(item.type === 'int' && !stack.isFloor() && stack.top.type === 'exp'){
			stack.pop();
			let m = stack.pop();
			if(m.type === 'int' || m.type === 'float'){
				let str = m.toString(10) + 'e' + item.toString(10);
				
				stack.push({type:'number', value:Number(str)});
			}
			else{
				throw new Error('Invalid exp-style');
			}
		}
		else{
			stack.push(item);
		}
	}
	
	return stack.toArray().slice(1);
}

const infixPriority = [
	',',
	';',
	'..',
	'|',
	'&',
	':',
	'->'
];
function sortingStation(tokens){
	const operation = new Stack();
	const values = new Stack();
	
	for(let item of tokens){
		if(item.type === 'opening'){
			operation.push(item);
		}
		else if(item.type === 'closing'){
			let val = operation.pop();
			while(val.type != 'opening'){
				if(val.type === 'infix' || val.type === 'space'){
					let b = values.pop();
					let a = values.pop();
					
					values.push({type:'eq', oper:val, args:[a,b]})
				}
				
				val = operation.pop();
			}
			if(val.type === 'opening'){
				let arg = values.pop();
				values.push({type:'br', opening:val, closing:item, args:[arg]});
			}
			else{
				throw SyntaxError('Unpaired brackets');
			}
		}
		else if(item.type === 'space'){
			let val = operation.pop();
			while(!operation.isFloor() && operation.top.type === 'infix'){
				let val = operation.pop();
				let b = values.pop();
				let a = values.pop();
					
				values.push({type:'eq', oper:val, args:[a,b]})
			}
			oparation.push(item);
		}
		else if(item.type === 'infix'){
			let pr = infixPriority.indexOf(item.value);
			while(!operation.isFloor() && 
				operation.top.type === 'infix' && infixPriority.indexOf(operation.top.value) > pr
			){
				let val = operation.pop();
				let b = values.pop();
				let a = values.pop();
					
				values.push({type:'eq', oper:val, args:[a,b]})
			}
			oparation.push(item);
		}
	}
	
	let val = operation.pop();
	while(val && val.type === 'infix' || val.type === 'space'){
		let b = values.pop();
		let a = values.pop();
		
		values.push({type:'eq', oper:val, args:[a,b]})
		
		val = operation.pop();
	}
	
	return values.pop();
}

function convertEquation(item){
	if(item.type === 'eq'){
		let name = item.oper.type === 'space' ? ' ' : item.oper.value;
		return [name, ...item.args.map(convertEquation)];
	}
	else if(item.type === 'br'){
		let arg = convertEquation(item.args[0]);
		let name = item.opening.value + ' ' + item.closing.value;
		return [name, arg];
	}
	else{
		return item.value;
	}
}

function buildAST(tokens){
	tokens = convertTockens(tokens);
	let ast = sortingStation(tokens);
	ast = convertEquation(ast);
	
	return ast;
}

module.exports = buildAST;