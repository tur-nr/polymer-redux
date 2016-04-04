(function(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory(require('redux'));
    } else if (typeof define === 'function' && define.amd) {
        define(['redux'], factory);
    } else {
        root['PolymerRedux'] = factory(root.Redux);
    }
})(this, function(Redux) {
    var warning = 'Polymer Redux: <%s>.%s has "notify" enabled, two-way bindings goes against redux\'s paradigm';

    return function(store) {
        var createListener = function(element, props) {
            return function() {
                var state = store.getState();
                props.forEach(function(property) {
                    if (typeof property.path == 'function') {
                        this[property.name] = property.path.call(this,state);
                    }
                    else {
                        this[property.name] = Polymer.Base.get(property.path, state);
                    }
                }, element);
            }
        }

        return {
            ready: function() {
                var props = [];
                var tag = this.constructor.name;
                var fire = this.fire.bind(this);
                var listener;

                // property bindings
                for (var name in this.properties) {
                    if (this.properties.hasOwnProperty(name)) {
                        if (this.properties[name].statePath) {
                            // notify flag, warn against two-way bindings
                            if (this.properties[name].notify) {
                                console.warn(warning, tag, name);
                            }
                            props.push({
                                name: name,
                                path: this.properties[name].statePath
                            });
                        }
                    }
                }

                // subscribe properties to state change
                if (props.length) {
                    listener = createListener(this, props);
                    store.subscribe(function() {
                      listener();
                      fire('state-changed', store.getState());
                    });
                    listener(); // starts state binding
                }
            },
            dispatch: function() {
                var args = Array.prototype.slice.call(arguments);
                var tag = this.constructor.name;
                var name;

                // action name
                if (typeof args[0] === 'string') {
                    name = args.splice(0, 1);
                    if (typeof this.actions[name] !== 'function') {
                        throw new TypeError('Polymer Redux: <' + tag + '> has no action "' + action + '"');
                    }
                    return store.dispatch(this.actions[name].apply(this, args));
                }

                // action creator
                if (typeof args[0] === 'function' && args[0].length === 0) {
                    return store.dispatch(args[0]());
                }

                // action
                return store.dispatch(args[0]);
            },
            getState: function() {
                return store.getState();
            }
        };
    };
});
