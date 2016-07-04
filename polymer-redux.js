(function(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root['PolymerRedux'] = factory();
    }
})(this, function() {
    var warning = 'Polymer Redux: <%s>.%s has "notify" enabled, two-way bindings goes against Redux\'s paradigm';

    /**
     * Factory function for creating a listener for a give Polymer element. The
     * returning listener should be passed to `store.subscribe`.
     *
     * @param {HTMLElement} element Polymer element.
     * @return {Function} Redux subcribe listener.
     */
    function createListener(element, store) {
        var props = [];
        var prevArrays = {}; // tracks array splices

        // property bindings
        Object.keys(element.properties).forEach(function(name) {
            prop = element.properties[name];
            if (prop.hasOwnProperty('statePath')) {
                // notify flag, warn against two-way bindings
                if (prop.notify && !prop.readOnly) {
                    console.warn(warning, element.is, name);
                }
                props.push({
                    name: name,
                    // Empty statePath return state
                    path: prop.statePath || store.getState,
                    readOnly: prop.readOnly,
                    type: prop.type
                });
            }
        });

        // redux listener
        return function() {
            var state = store.getState();
            props.forEach(function(property) {
                var propName = property.name;
                var splices = [];
                var value, previous;

                // statePath, a path or function.
                var path = property.path;
                if (typeof path == 'function') {
                    value = path.call(element, state);
                } else {
                    value = Polymer.Base.get(path, state);
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
            element.fire('state-changed', state);
        }
    }

    /**
     * Binds an given Polymer element to a Redux store.
     *
     * @param {HTMLElement} element Polymer element.
     * @param {Object} store Redux store.
     */
    function bindReduxListener(element, store) {
        var listener;

        if (element._reduxUnsubscribe) return;

        listener = createListener(element, store);
        listener(); // start bindings

        element._reduxUnsubscribe = store.subscribe(listener);
    }

    /**
     * Unbinds a Polymer element from a Redux store.
     *
     * @param {HTMLElement} element
     */
    function unbindReduxListener(element) {
        if (typeof element._reduxUnsubscribe === 'function') {
            element._reduxUnsubscribe();
            delete element._reduxUnsubscribe;
        }
    }

    /**
     * Dispatches a Redux action via a Polymer element. This gives the element
     * a polymorphic dispatch function. See the readme for the various ways to
     * dispatch.
     *
     * @param {HTMLElement} element Polymer element.
     * @param {Array} args The arguments passed to `element.dispatch`.
     * @param {Object} store Redux store.
     * @return {Object} The computed Redux action.
     */
    function dispatchReduxAction(element, args, store) {
        var action = args[0];
        var actions = element.actions;

        // action name
        if (actions && typeof action === 'string') {
            if (typeof actions[action] !== 'function') {
                throw new TypeError('Polymer Redux: <' + element.is + '> has no action "' + action + '"');
            }
            return store.dispatch(actions[action].apply(element, args.slice(1)));
        }

        // action creator
        if (typeof action === 'function' && action.length === 0) {
            return store.dispatch(action());
        }

        // action
        return store.dispatch(action);
    }

    return function(store) {
        // check for store
        if (!store) {
            throw new TypeError('missing redux store');
        }

        return {
            ready: function() {
                bindReduxListener(this, store);
            },
            attached: function() {
                bindReduxListener(this, store);
            },
            detached: function() {
                unbindReduxListener(this);
            },
            dispatch: function() {
                var args = Array.prototype.slice.call(arguments);
                return dispatchReduxAction(this, args, store);
            },
            getState: store.getState
        };
    };
});
