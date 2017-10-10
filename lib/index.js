var PolymerRedux = (function () {
'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof commonjsGlobal !== "undefined") {
    win = commonjsGlobal;
} else if (typeof self !== "undefined") {
    win = self;
} else {
    win = {};
}

var window_1 = win;

var console_1 = console;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Expose globals
var CustomEvent = window_1.CustomEvent;
var Polymer = window_1.Polymer;

/**
 * Polymer Redux
 *
 * Creates a Class mixin for decorating Elements with a given Redux store.
 *
 * @param {Object} store Redux store.
 * @return {Function} Class mixin.
 */

function PolymerRedux(store) {
	if (!store) {
		throw new TypeError('PolymerRedux: expecting a redux store.');
	} else if (!['getState', 'dispatch', 'subscribe'].every(function (k) {
		return typeof store[k] === 'function';
	})) {
		throw new TypeError('PolymerRedux: invalid store object.');
	}

	var subscribers = new Map();

	/**
  * Binds element's properties to state changes from the Redux store.
  *
  * @example
  *     const update = bind(el, props) // set bindings
  *     update(state) // manual update
  *
  * @private
  * @param {HTMLElement} element
  * @param {Object} properties
  * @return {Function} Update function.
  */
	var bind = function bind(element, properties, mapStateToProps) {
		var elementName = element.constructor.is;

		var bindings = Object.keys(properties).filter(function (name) {
			var property = properties[name];
			if (Object.prototype.hasOwnProperty.call(property, 'statePath')) {
				if (!property.readOnly && property.notify) {
					console_1.warn('PolymerRedux: <' + elementName + '>.' + name + ' has "notify" enabled, two-way bindings goes against Redux\'s paradigm.');
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
		var update = function update(state) {
			var mappedState = mapStateToProps ? mapStateToProps(state) : {};
			var updates = bindings.reduce(function (props, name) {
				var statePath = properties[name].statePath;
				var value = typeof statePath === 'function' ? statePath.call(element, state) : Polymer.Path.get(state, statePath);

				// Warn about double bindings
				if (props[name]) {
					console_1.warn('PolymerRedux: <' + elementName + '>.' + name + ' has double bindings, statePath binding has priority.');
				}

				return _extends({}, props, _defineProperty({}, name, value));
			}, mappedState);

			element.setProperties(updates, true);
		};

		// Redux listener
		var unsubscribe = store.subscribe(function () {
			var detail = store.getState();
			update(detail);

			element.dispatchEvent(new CustomEvent('state-changed', { detail: detail }));
		});

		subscribers.set(element, unsubscribe);
		update(store.getState());

		return update;
	};

	/**
  * Unbinds an element from state changes in the Redux store.
  *
  * @private
  * @param {HTMLElement} element
  */
	var unbind = function unbind(element) {
		var off = subscribers.get(element);
		if (typeof off === 'function') {
			off();
		}
	};

	/**
  * Merges a property's object value using the defaults way.
  *
  * @private
  * @param {Object} what Initial prototype
  * @param {String} which Property to collect.
  * @return {Object} the collected values
  */
	var collect = function collect(what, which) {
		var res = {};
		while (what) {
			res = _extends({}, what[which], res); // Respect prototype priority
			what = Object.getPrototypeOf(what);
		}
		return res;
	};

	/**
  * Adds events listeners to a element.
  *
  * @param {HTMLElement} element
  * @param {Object} listeners List of event listeners to add.
  */
	function addListeners(element, listeners) {
		Object.keys(listeners).forEach(function (name) {
			element.addEventListener(name, listeners[name]);
		});
	}

	/**
  * Removes events listeners from an element.
  *
  * @param {HTMLElement} element
  * @param {Object} listeners List of event listeners to remove.
  */
	function removeListeners(element, listeners) {
		Object.keys(listeners).forEach(function (name) {
			element.removeEventListeners(name, listeners[name]);
		});
	}

	/**
  * ReduxMixin
  *
  * @example
  *     const ReduxMixin = PolymerRedux(store)
  *     class Foo extends ReduxMixin(Polymer.Element) { }
  *
  * @polymer
  * @mixinFunction
  *
  * @param {Polymer.Element} parent The polymer parent element.
  * @return {Function} PolymerRedux mixed class.
  */
	return function (parent, mapStateToProps, mapEventsToDispatch) {
		if (mapStateToProps && typeof mapStateToProps !== 'function') {
			throw new TypeError('PolymerRedux: expects mapStateToProps to be a function');
		}

		if (mapEventsToDispatch && typeof mapEventsToDispatch !== 'function') {
			throw new TypeError('PolymerRedux: expects mapEventsToDispatch to be a function');
		}

		/**
   * @polymer
   * @mixinClass
   */
		return class ReduxMixin extends parent {
			constructor() {
				var _this;

				_this = super();

				// Collect the action creators first as property changes trigger
				// dispatches from observers, see #65, #66, #67
				var reduxActions = collect(this.constructor, 'actions');

				// If we have any mapped events to dispatch, build the liseners object
				var mappedEvents = mapEventsToDispatch ? mapEventsToDispatch(function () {
					return _this.dispatch.apply(_this, arguments);
				}) : {};

				// Bind the listeners to call with the event and the current state
				var reduxMappedListeners = Object.keys(mappedEvents).reduce(function (listeners, name) {
					return _extends({}, listeners, _defineProperty({}, name, function (event) {
						event.stopImmediatePropagation();
						mappedEvents[name](event, store.getState());
					}));
				}, {});

				// Define properties
				Object.defineProperties(this, {
					_reduxActions: {
						value: reduxActions
					},
					_reduxMappedListeners: {
						value: reduxMappedListeners
					}
				});
			}

			connectedCallback() {
				super.connectedCallback();
				var properties = collect(this.constructor, 'properties');
				bind(this, properties, mapStateToProps);
				addListeners(this, this._reduxMappedListeners);
			}

			disconnectedCallback() {
				super.disconnectedCallback();
				unbind(this);
				removeListeners(this, this._reduxMappedListeners);
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
				var _this2 = this;

				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				var actions = this._reduxActions;

				// Action creator
				var action = args[0];

				if (typeof action === 'string') {
					if (typeof actions[action] !== 'function') {
						throw new TypeError('PolymerRedux: <' + this.constructor.is + '> invalid action creator "' + action + '"');
					}
					action = actions[action].apply(actions, _toConsumableArray(args.slice(1)));
				}

				// Proxy async dispatch
				if (typeof action === 'function') {
					var originalAction = action;
					action = function action() {
						for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
							args[_key2] = arguments[_key2];
						}

						// Replace redux dispatch
						args.splice(0, 1, function () {
							return _this2.dispatch.apply(_this2, arguments);
						});
						return originalAction.apply(undefined, args);
					};

					// Copy props from the original action to the proxy.
					// see https://github.com/tur-nr/polymer-redux/issues/98
					Object.keys(originalAction).forEach(function (prop) {
						action[prop] = originalAction[prop];
					});
				}

				return store.dispatch(action);
			}

			/**
    * Gets the current state in the Redux store.
    *
    * @return {*}
    */
			getState() {
				return store.getState();
			}
		};
	};
}

return PolymerRedux;

}());
