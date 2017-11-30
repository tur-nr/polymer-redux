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

window.JSCompiler_renameProperty = function (prop, obj) {
  return prop;
};

function normalize(path) {
  if (Array.isArray(path)) {
    var parts = [];
    for (var i = 0; i < path.length; i++) {
      var args = path[i].toString().split('.');
      for (var j = 0; j < args.length; j++) {
        parts.push(args[j]);
      }
    }
    return parts.join('.');
  } else {
    return path;
  }
}

function split(path) {
  if (Array.isArray(path)) {
    return normalize(path).split('.');
  }
  return path.toString().split('.');
}

function get(root, path, info) {
  var prop = root;
  var parts = split(path);
  // Loop over path parts[0..n-1] and dereference
  for (var i = 0; i < parts.length; i++) {
    if (!prop) {
      return;
    }
    var part = parts[i];
    prop = prop[part];
  }
  if (info) {
    info.path = parts.join('.');
  }
  return prop;
}

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Expose globals
var CustomEvent = window_1.CustomEvent;

/**
 * Polymer Redux
 *
 * Creates a Class mixin for decorating Elements with a given Redux store.
 *
 * @polymerMixin
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
	var bind = function bind(element, properties) {
		var bindings = Object.keys(properties).filter(function (name) {
			var property = properties[name];
			if (Object.prototype.hasOwnProperty.call(property, 'statePath')) {
				if (!property.readOnly && property.notify) {
					console_1.warn('PolymerRedux: <' + element.constructor.is + '>.' + name + ' has "notify" enabled, two-way bindings goes against Redux\'s paradigm');
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
			var propertiesChanged = false;
			bindings.forEach(function (name) {
				// Perhaps .reduce() to a boolean?
				var statePath = properties[name].statePath;

				var value = typeof statePath === 'function' ? statePath.call(element, state) : get(state, statePath);

				var changed = element._setPendingPropertyOrPath(name, value, true);
				propertiesChanged = propertiesChanged || changed;
			});
			if (propertiesChanged) {
				element._invalidateProperties();
			}
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
  * ReduxMixin
  *
  * @example
  *     const ReduxMixin = PolymerRedux(store)
  *     class Foo extends ReduxMixin(Polymer.Element) { }
  *
  * @polymerMixinClass
  *
  * @param {Polymer.Element} parent The polymer parent element.
  * @return {Function} PolymerRedux mixed class.
  */
	return function (parent) {
		return class ReduxMixin extends parent {
			constructor() {
				super();

				// Collect the action creators first as property changes trigger
				// dispatches from observers, see #65, #66, #67
				var actions = collect(this.constructor, 'actions');
				Object.defineProperty(this, '_reduxActions', {
					configurable: true,
					value: actions
				});
			}

			connectedCallback() {
				super.connectedCallback();
				var properties = collect(this.constructor, 'properties');
				bind(this, properties);
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
				var _this = this;

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
							return _this.dispatch.apply(_this, arguments);
						});
						return originalAction.apply(undefined, args);
					};
					// Copy props from the original action to the proxy.
					// see https://github.com/tur-nr/polymer-redux/issues/98
					Object.keys(originalAction).forEach(function (prop) {
						action[prop] = originalAction[prop];
					});

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
