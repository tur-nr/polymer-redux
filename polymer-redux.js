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
            var prevArrays = {};
            return function() {
                var state = store.getState();
                props.forEach(function(property) {
                    var splices = [];
                    var value, previous;

                    // statePath a path or function
                    if (typeof property.path == 'function') {
                        value = property.path.call(element, state);
                    } else {
                        value = Polymer.Base.get(property.path, state);
                    }

                    // type of array, work out splices before setting the value
                    if (property.type === Array && value !== undefined) {
                        // compare the splices from a previous copy
                        previous = prevArrays[property.name] || [];
                        splices = Polymer.ArraySplice.calculateSplices(value, previous);
                        // keep for next compare
                        prevArrays[property.name] = value ? value.concat() : [];
                    }

                    // set
                    if (property.readOnly) {
                        element.notifyPath(property.name, value);
                    } else {
                        element.set(property.name, value);
                    }

                    // notify element of splices
                    if (splices.length) {
                        element.notifySplices(property.name, splices);
                    }
                });
            }
        };

        return {
            ready: function() {
                var props = [];
                var tag = this.constructor.name;
                var fire = this.fire.bind(this);
                var listener, prop;

                // property bindings
                for (var name in this.properties) {
                    if (this.properties.hasOwnProperty(name)) {
                        if (this.properties[name].statePath) {
                            prop = this.properties[name];
                            // notify flag, warn against two-way bindings
                            if (prop.notify && !prop.readOnly) {
                                console.warn(warning, tag, name);
                            }
                            props.push({
                                name: name,
                                path: prop.statePath,
                                readOnly: prop.readOnly,
                                type: prop.type
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
                var actions = this.actions;
                var name;

                // action name
                if (actions && typeof args[0] === 'string') {
                    name = args.splice(0, 1);
                    if (typeof actions[name] !== 'function') {
                        throw new TypeError('Polymer Redux: <' + tag + '> has no action "' + name + '"');
                    }
                    return store.dispatch(actions[name].apply(this, args));
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
