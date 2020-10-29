const lexer = require('../lexer.js');

//console.log(lexer('1, 2 3'));
console.log(lexer('-1.2e+1 \'(2 3) -2#101:-0xfff'));

//console.log(lexer(`"abdc'((}}\\" +1 a->b`));