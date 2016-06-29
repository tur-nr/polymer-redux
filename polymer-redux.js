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
                    var propName = property.name;
                    var splices = [];
                    var value, previous;

                    // statePath a path or function
                    if (typeof property.path == 'function') {
                        value = property.path.call(element, state);
                    } else {
                        value = Polymer.Base.get(property.path, state);
                    }

                    // type of array, work out splices before setting the value
                    if (property.type === Array) {
                        // compare the splices from a previous copy
                        previous = prevArrays[propName] || [];
                        value = value || [];
                        // check the value type
                        if (!Array.isArray(value)) {
                            throw new TypeError('<%s>.%s type is Array but given: %s', element.is, propName, typeof value);
                        }
                        splices = Polymer.ArraySplice.calculateSplices(value, previous);
                        // keep for next compare
                        prevArrays[propName] = value.slice();
                    }

                    // set
                    if (property.readOnly) {
                        element.notifyPath(propName, value);
                    } else {
                        element.set(propName, value);
                    }

                    // notify element of splices
                    if (splices.length) {
                        element.notifySplices(propName, splices);
                    }
                });
            }
        };

        // check for store
        if (!store) {
            throw new TypeError('missing redux store');
        }

        return {
            ready: function() {
                var props = [];
                var element = this;
                var tag = element.is;
                var listener, prop;

                // property bindings
                Object.keys(element.properties).forEach(function(name) {
                    prop = element.properties[name];
                    if (prop.hasOwnProperty("statePath")) {
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
                });

                // subscribe properties to state change
                if (props.length) {
                    listener = createListener(element, props);
                    store.subscribe(function() {
                        listener();
                        element.fire('state-changed', store.getState());
                    });
                    listener(); // starts state binding
                }
            },
            dispatch: function(action) {
                var args = Array.prototype.slice.call(arguments);
                var tag = this.is;
                var actions = this.actions;
                var name;

                // action name
                if (actions && typeof action === 'string') {
                    name = args.shift();
                    if (typeof actions[name] !== 'function') {
                        throw new TypeError('Polymer Redux: <' + tag + '> has no action "' + name + '"');
                    }
                    return store.dispatch(actions[name].apply(this, args));
                }

                // action creator
                if (typeof action === 'function' && action.length === 0) {
                    return store.dispatch(action());
                }

                // action
                return store.dispatch(action);
            },
            getState: store.getState
        };
    };
});
