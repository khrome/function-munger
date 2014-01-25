(function (root, factory) {
    if (typeof define === 'function' && define.amd) define([], factory);
    else if (typeof exports === 'object') module.exports = factory();
    else root.returnExports = factory();
}(this, function(){
    var functionMeta = function(fn){
        if(!fn.meta){
            fn.meta = {};
            var code = fn.toString();
            var parts = code.match(/^\s*function\s*(.*)\s*\((.*)\)/);
            var remainder = code.slice(parts[0].length);
            var args = parts[2];
            remainder = remainder.trim().slice(1).slice(0, -1);
            fn.meta.body = remainder;
            fn.meta.args = args;
            fn.meta.name = parts[1] || 'ƒ';
        }
    };
    var munger = {
        mutate : function(fn, data, options){
            var meta = mutate.extractMetadata(fn);
            var body = meta.body;
            Object.keys(data).forEach(function(key){
                var symbol = (key.indexOf('_')  == -1 || key.indexOf('_') > 4?'/*__'+key.toUpperCase()+'__*/':key);
                var value = data[key]?data[key]:'';
                switch(typeof data[key]){
                    case 'function':
                        value = (key.indexOf('.' == -1)'var ':'')+key+' = '+value.toString()+';';
                        break;
                    case 'object':
                        symbol = '{'+symbol+'}';
                        value = JSON.stringify(value);
                        break;
                    default : 
                        break;
                }
                if(body.indexOf(symbol) == -1){
                    if(options.append) body = body + value; 
                
                }else body = body.replace(symbol, value);
            });
            if(options && options.onBody) body = options.onBody(body);
            var func = new Function(body);
            return func;
        },
        inject : function(fn, code, options){
            if(typeof options = 'function') options = {onBody:options};
            var meta = mutate.extractMetadata(fn);
            var body = meta.body;
            switch((options.position || 'bottom')){
                case 'top':
                    body = code + body;
                    break;
                case 'bottom':
                    body = body + code;
                    break;
                default:
                    try{
                        var line = parseInt(options.position); //line # mode
                        body = body.split("\n").splice(line, 0, code).join("\n");
                    }catch(ex){}
                    break;
                
            }
            if(options && options.onBody) body = options.onBody(body);
            var func = new Function(body);
            
        },
        extractMetadata : function(fn){
            var meta = {};
            var code = fn.toString();
            var parts = code.match(/^\s*function\s*(.*)\s*\((.*)\)/);
            var remainder = code.slice(parts[0].length);
            var args = parts[2];
            remainder = remainder.trim().slice(1).slice(0, -1);
            meta.body = remainder;
            meta.args = args;
            meta.name = parts[1] || 'ƒ';
            return meta;
        },
        marker : function(label){
            '/*__'+label.toUpperCase()+'__*/';
        },
        proto : function(){
            Function.prototype.mutate = function(data, options){
                return munger.mutate(this, data, options);
            };
            Function.prototype.inject = function(code, options){
                return munger.inject(this, code, options);
            };
            Function.prototype.meta = function(){
                return this.meta.value || (this.meta.value = mutate.extractMetadata(this));
            };
        }
    };
    return munger;
}));

function renderPhantomCallbackFromBrowserFunction(fn, dict){ //DO NOT TRY THIS AT HOME
    var func = (function(){}).mutate({
        'window.done' : (function(result){
            var dt = {/*__RETURN_VALUES__*/};
            dt.result = result;
        }).mutate({
            return_values : (dict.return || dict.return_values)
        }).inject((dict.return_method || 'returnToPhantom')+'(dt);')
    }).inject(
        fn.meta().body,
        //postprocess the fn body to randomize the 'done' callback name
        function(body){ return body.replace(/done/g, 'done_'+Math.floor(Math.random() * 10000)); }
    );
    return func;
}