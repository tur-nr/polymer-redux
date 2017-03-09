(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.PolymerRedux = factory());
}(this, (function () { 'use strict';

/**
 * Polymer Redux
 *
 * Creates a Class mixin for decorating Elements with a given Redux store.
 *
 * @param {Object} store Redux store.
 * @return {Function} Class mixin.
 */
var index = function (store) {
    var subscribers = new Map();

    /**
     * Binds element's properties to state changes from the Redux store.
     *
     * @example
     *     const update = bind(el, props) // set bindings
     *     update(state) // manuel update
     *
     * @private
     * @param {HTMLElement} element
     * @param {Object} properties
     * @return {Function} Update function.
     */
    var bind = function (element, properties) {
        if (subscribers.has(element)) return;

        var bindings = Object.keys(properties).filter(function (name) {
            var property = properties[name];
            if (property.hasOwnProperty('statePath')) {
                if (!property.readOnly && property.notify) {
                    console.warn('PolymerRedux: <' + String(element.constructor.is) + '>.' + String(name) + ' has "notify" enabled, two-way bindings goes against Redux\'s paradigm');
                }
                return true;
            }
            return false;
        });

        /**
         * Updates an element's properties with the given state.
         *
         * @private
         * @param {Object} state
         */
        var update = function (state) {
            bindings.forEach(function (name) {
                var _properties$name = properties[name],
                    statePath = _properties$name.statePath,
                    readOnly = _properties$name.readOnly;

                var value = typeof statePath === 'function' ? statePath.call(element, state) : Polymer.Path.get(state, statePath);

                if (readOnly) {
                    element._setProperty(name, value);
                } else {
                    element[name] = value;
                }
            });
        };

        // redux listener
        var unsubscribe = store.subscribe(function () {
            var state = store.getState();
            update(state);

            element.dispatchEvent(new CustomEvent('state-changed', {
                detail: state
            }));
        });

        subscribers.set(element, unsubscribe);

        return update(store.getState());
    };

    /**
     * Unbinds an element from state changes in the Redux store.
     *
     * @private
     * @param {HTMLElement} element
     */
    var unbind = function (element) {
        var off = subscribers.get(element);
        if (typeof off === 'function') off();
    };

    /**
     * Collect values throughout proto chain
     * @private
     * @patam {Object} what  the initial prototype
     * @param {String} which the property to collect
     * @return {Object} the collected values
     */
    var collect = function(what, which) {
      let res = {};
      while (what) {
        res = Object.assign(res, what[which]);
        what = what.__proto__;
      }
      return res;
    }

    /**
     * Redux Mixin
     *
     * @example
     *     const ReduxMixin = PolymerRedux(store)
     *     class Foo extends ReduxMixin(Polymer.Element) { }
     *
     * @param {Polymer.Element} parent The polymer parent element.
     * @return {Function} PolymerRedux mixed class.
     */
    return function (parent) {
        return class extends parent {
            connectedCallback() {
                super.connectedCallback();

                var properties = collect(this.constructor,'properties');

                bind(this, properties || {});
            }

            disconnectedCallback() {
                super.disconnectedCallback();
                unbind(this);
            }

            /**
             * Dispatches an action to the Redux store.
             *
             * @example
             *     element.dispatch({ type: 'ACTION' })
             *
             * @example
             *     element.dispatch('actionCreator', 'foo', 'bar')
             *
             * @example
             *     element.dispatch((dispatch) => {
             *         dispatch({ type: 'MIDDLEWARE'})
             *     })
             *
             * @param  {...*} args
             * @return {Object} The action.
             */
            dispatch() {
                var actions = this.constructor.actions;

                // action creator

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var action = args[0];

                if (typeof action === 'string') {
                    if (!actions || typeof actions[action] !== 'function') {
                        throw new TypeError('PolymerRedux: <' + String(this.constructor.is) + '> has no action creator "' + action + '"');
                    }
                    action = actions[action].apply(this.constructor, args.slice(1));
                }

                return store.dispatch(action);
            }
        };
    };
};

return index;

})));
