function-munger.js
==============
Sometimes you need to modify a function at runtime

    var munger = require('function-munger');

mutate
------
you can now specify that you only want the event if certain values are set:

    munger.mutate(fn, [data], [options])
    

data is written into the function body, using comment signatures which look like `\*__SYMBOL__*\` and can be generate using `munger.marker('symbol')` (though are likely more valuable for use when hardcoded) This allows us to use value rendering to inject data to cross boundaries which closures do not.


inject
------
you can also inject logic into the function at the top bottom or at a specific line number

    munger.inject(fn, [options])
    
options.position can be set to 'top', 'bottom'(default) or a specific line #


practical applications
----------------------

so, for example, lets say we're in an isolated browser environment being controlled by another process which only communicates through a callback (we'll call it `callPhantom`) and we can eval into (as is the situation with the phantom.js driver). What we want to do is create a callback and wrap an incoming function call so that there is an internal callback to enable true asynchronous calls.
    
so let's take a function `fn` and have that execute in the client and when `done()` is called the `callback` in the parent process executes:

    var callbacks = {};
    function asyncRemoteOperation(page, fn, callback){
        var id = uuid.v4();
        callbacks[id] = callback;
        var returnData 
        var remoteLogic = function(){
            var done = function(){
                var returnData = {/*__RETURN_DATA__*/};
                returnData.type = 'callback';
                returnData.args = Array.prototype.slice.call(arguments);
                callPhantom(returnData);
            }
            /*__THE_FUNCTION__*/
        };
        page.eval(munger.mutate(remoteLogic, {
            the_function : fn,
            return_data : {
                callbackID : id
            }
        }));
    }
    page.onCallback(function(payload){
        switch(payload.type){
            case 'callback':
                if(!callbacks[payload.callbackID]) throw('Missing callback('+payload.callbackID+')!');
                callbacks[payload.callbackID].apply(callbacks[payload.callbackID], payload.args);
                delete callbacks[payload.callbackID];
                break;
        }
    });
    
Now we can use that to make async calls into phantom without screwing around with polling across processes:

    asyncRemoteOperation(phantomPageInstance, function(done){
        el.animate({
            height: 0
          }, 5000, function() {
            done(el.css('height'));
          });
    }, function(height){
        should.exist(height);
        height.should.equal(0);
        //now we've verified that after animating the height is actually 0px
    })
    
I'm sure there are other applications for this
    

prototype
---------
stick these functions directly to the `Function` object:

    munger.proto();


Testing
-------

Run the tests at the project root with:

    mocha

Enjoy,

-Abbey Hawk Sparrow