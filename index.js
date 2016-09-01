module.exports = function(Nightmare) {

    Nightmare.action('evaluateWithCallback', function() {

        // expected args -> func, argn, done
        // * func is the function passed in by the user to be executed in Electron
        // * argn is an optional, variable number of parameters to be passed to func
        //   The callback will be passed at the end of the parameter list
        // * done

        var args = Array.prototype.slice.call(arguments);
        var done = args.pop();
        var func = args.splice(0, 1)[0];

        if (!func || typeof func !== 'function') {
            done('Execution function not provided');
            return;
        }

        this.evaluate_now(function(func, args) {

            // keep track of asyn evaluations inside of Electron
            window.__asynceval = window.__asynceval || (function() {

                var map = {};

                // generates a unique handle
                var generateHandle = function() {
                    var handle = Math.floor((Math.random() * 10000) + 1);

                    if (map[handle]) {
                        return generateHandle();
                    }

                    return handle;
                }

                // generates a self-managing callback function
                var generateCallback = function(handle) {

                    var wasCalled = false;
                    var args;

                    var func = function() {
                        wasCalled = true;
                        args = Array.prototype.slice.call(arguments);
                    }

                    func.getHandle = function() {
                        return handle;
                    }

                    func.getArguments = function() {
                        return args;
                    }

                    func.wasCalled = function() {
                        return wasCalled;
                    }

                    return func;
                }

                // public methods
                return {
                    generateCallback: function() {
                        var handle = generateHandle();
                        var callback = generateCallback(handle);

                        map[handle] = callback;

                        return callback;
                    },

                    wasCalled: function(handle) {
                        return map[handle] ? map[handle].wasCalled() : null;
                    },

                    getArguments: function(handle) {
                        return map[handle] ? map[handle].getArguments() : null;
                    }
                }
            })();

            var callback = window.__asynceval.generateCallback();
            args.push(callback);

            // func was stringified to allow it to cross the execution boundry
            // eval and execute
            eval("("+func+")").apply(window, args);

            // return the callback handle
            return callback.getHandle();

        }, function(error, handle) {

            // if there was an execution error, bubble out
            if (error) {
                done.apply(this, arguments);
                return;
            }

            // checks the handle on interval until it returns
            var checkHandle = (function(handle) {

                this.evaluate_now(function(handle) {

                    return {
                        wasCalled: window.__asynceval.wasCalled(handle),
                        arguments: window.__asynceval.getArguments(handle)
                    }

                }, function(error, result) {

                    if (error) {
                        done.apply(this, arguments);
                        return;
                    }

                    // if the callback hasn't been invoked, check again later
                    if (result.wasCalled) {
                        done(undefined, result.arguments)
                    } else {
                        setTimeout(checkHandle, 10, handle);
                    }

                }, handle);

            }).bind(this); // tighten the scope

            // first check is immediate
            checkHandle(handle);

        }.bind(this), func.toString(), args); // tighten the scope
    })
}
