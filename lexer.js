
const reString = /"(?:[^"]|\\\\|\\")*"/gi;
const reNumber = /[+-]?\d+/gi;
const reSpace = /\s+/g;

const splitter = /("(?:[^"]|\\\\|\\")*"|[+-]?\d+|\s+)/gu;

const Evaluator = require('./letter-forth.js');

function grab(re, type){
	return (stack, str, index)=>{
		re.lastIndex = index;
		let m = re.exec(str);
		let value = m[0];
		
		if(m.index !== index){
			throw new Error('Incorrect position');
		}
		
		type && stack.push({type, value});

		//console.log(m, re.lastIndex);
		
		return re.lastIndex;
	};
}

function one(type){
	return (stack, str, index)=>{
		
		type && stack.push({type, value:str[index]});
		
		return index+1;
	};
}

const alter = one('sign');

function clearSpace(stack){
	if(!stack.isFloor() && stack.top.type === 'space'){
		stack.pop(); // игнорируем пробел
	}
}

function addSpace(stack){
	let spc = stack.isFloor() || ['opening', 'infix', 'space'].includes(stack.top.type);
	if(!spc){
		stack.push({type:'space', value:' '});
	}
}

const hex = grab(/[\d+a-f]+/gi, 'hex');


const digit = grab(/\d+/g, 'digit');

function based(base){
	const abc = ('0123456789abcdefghijklmnopqrstuvw').slice(0, base);
	
	const re = RegExp('['+abc+']+', 'gi');
	return (stack, str, index)=>{
		re.lastIndex = index;
		let m = re.exec(str);
		let value = m[0];
		
		if(m.index !== index){
			throw new Error('Incorrect position');
		}

		stack.push({type:'based', value, base, abc});
		
		return re.lastIndex;
	};
}

function zero(stack, str, index){
	if(str[index+1] === 'x'){
		return hex(stack, str, index+2);
	}
	else{
		return digit(stack, str, index);
	}
}

function space(stack, str, index){
	let re = /[\s\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g;
	let skip = stack.isFloor() || stack.top.type === 'opening' || stack.top.type === 'infix';
	clearSpace(stack);
	return grab(re, !skip && 'space')(stack, str, index);
}

const quote = grab(/("(?:[^"]|\\\\|\\")*"|[+-]?\d+|\s+)/g, 'string');

const ident = grab(/[a-z_$][\d_$a-z]*/gi, 'ident');

function comma(stack, str, index){
	if(str[index+1] === '.'){
		clearSpace(stack);
		stack.push({type:'infix', value:'..'});
		return index+2
	}
	else if(!stack.isFloor() && (stack.top.type === 'digit' || stack.top.type === 'decint')){
		if(('0123456789').includes(str[index+1])){
			index = digit(stack, str, index+1);
			let part = stack.pop().value;
			let units = stack.pop().value;
			let value = units + '.' + part;
			stack.push({type:'float', value});
			return index;
		}
		else{
			let value = stack.pop().value;
			stack.push({type:'float', value});
			return index+1;
		}
	}
	else{
		return infix(stack, str, index);
	}
}

function letterE(stack, str, index){
	if(stack.isFloor()){
		return ident(stack, str, index);
	}
	else if(stack.top.type === 'digit' || stack.top.type === 'decint' || stack.top.type === 'float'){
		stack.push({type:'exp'});
		return index+1;
	}
	else{
		return ident(stack, str, index);
	}
}
function plus(stack, str, index){
	let s = str[index+1];
	
	if(s==='0'){
		index = zero(stack, str, index+1);
		let val = stack.pop();
		if(val.type === 'hex'){
			stack.push({type:'hexint', value:'0x'+val.value});
		}
		else if(val.type === 'digit'){
			stack.push({type:'decint', value:val.value});
		}
		return index;
	}
	else if(('123456789').includes(s)){
		index = digit(stack, str, index+1);
		let val = stack.pop();
		if(val.type === 'digit'){
			stack.push({type:'decint', value:val.value});
		}
		return index;
	}
	
	return infix(stack, str, index);
}

function minus(stack, str, index){
	let s = str[index+1];
	
	if(s==='0'){
		index = zero(stack, str, index+1);
		let val = stack.pop();
		if(val.type === 'hex'){
			stack.push({type:'hexint', value:'-0x'+val.value});
		}
		else if(val.type === 'digit'){
			stack.push({type:'decint', value:'-'+val.value});
		}
		return index;
	}
	else if(('123456789').includes(s)){
		index = digit(stack, str, index+1);
		let val = stack.pop();
		if(val.type === 'digit'){
			stack.push({type:'decint', value:'-'+val.value});
		}
		return index;
	}
	
	if(s === '>'){
		clearSpace(stack);
		
		stack.push({type:'infix', value:'->'});
		return index+2;
	}
	
	return infix(stack, str, index);
}

function apos(stack, str, index){
	let s = str[index+1];
	if(('({[').includes(s)){
		addSpace(stack);
		stack.push({type:'opening', value:"'"+s});
		return index+2;
	}

	return alter(stack, str, index);
}

function hash(stack, str, index){
	if(!stack.isFloor()){
		if(stack.top.type === 'digit' || stack.top.type === 'decint'){
			let base = Number(stack.pop().value);
			let sign = '';
			if(base<0){
				sign = '-';
				base = -base;
			}
			if(base>32){
				return alter(stack, str, index);
			}
			else{
				index = based(base)(stack, str, index+1);
				if(sign){
					stack.top.sign = sign;
				}
				return index;
			}
		}
	}
	return alter(stack, str, index);
}


function opening(stack, str, index){
	addSpace(stack);
	return one('opening')(stack, str, index);
}

function infix(stack, str, index){
	clearSpace(stack);
	return one('infix')(stack, str, index);
}

function closing(stack, str, index){
	clearSpace(stack);
	index = one('closing')(stack, str, index);
	addSpace(stack);
	return index;
}

const lexer = Evaluator({
	[Evaluator.TERMINATOR]:(stack)=>{
		let res = stack.toArray();
		stack.popUntil(()=>(false));
		res.shift();
		stack.push(res);
	},
	'0':zero,
	'123456789':digit,
	'"':quote,
	' \t\n\r\f\x0B\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000': space,
	'.':comma,
	'eE':letterE,
	'ABCDFGHIJKLMNOPQRSTUVWXYZabcdfghijklmnopqrstuvwxyz':ident,
	'_$':ident,
	',;&|:':infix,
	'([{':opening,
	')]}':closing,
	"'":apos,
	'#':hash,
	'-':minus,
	'+':plus
});

module.exports = lexer;