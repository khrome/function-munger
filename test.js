var should = require("should");
var request = require("request");
var munger = require('./munger');
munger.proto(); // attach to Function.prototype

describe('function-munger', function(){
    var application;
    var running = false;
    var collection;
    var theSet;
    
    it('injects a line of code', function(){
        var fn = (function(){}).inject('return 42;');
        var result = fn();
        should.exist(result);
        result.should.equal(42);
    });
    
    it('mutates a function', function(){
        var fn = (function(){
            var result = 2;
            /*__FIRST__*/
            /*__SECOND__*/
            return result;
        });
        var add = 'result += 3;';
        var mult = 'result *= 3;';
        var resultOne = fn.mutate({
            first : add,
            second : mult
        })();
        var resultTwo = fn.mutate({
            first : mult,
            second : add
        })();
        should.exist(resultOne);
        resultOne.should.equal(15);
        should.exist(resultTwo);
        resultTwo.should.equal(9);
    });
});