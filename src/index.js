import window from 'global/window';
import console from 'global/console';

// Expose globals
const {CustomEvent, Polymer} = window;

/**
 * Polymer Redux
 *
 * Creates a Class mixin for decorating Elements with a given Redux store.
 *
 * @param {Object} store Redux store.
 * @return {Function} Class mixin.
 */
export default function PolymerRedux(store) {
	if (!store) {
		throw new TypeError('PolymerRedux: expecting a redux store.');
	} else if (!['getState', 'dispatch', 'subscribe'].every(k => typeof store[k] === 'function')) {
		throw new TypeError('PolymerRedux: invalid store object.');
	}

	const subscribers = new Map();

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
	const bind = (element, properties, mapStateToProps) => {
		const elementName = element.constructor.is;

		const bindings = Object.keys(properties)
			.filter(name => {
				const property = properties[name];
				if (Object.prototype.hasOwnProperty.call(property, 'statePath')) {
					if (!property.readOnly && property.notify) {
						console.warn(`PolymerRedux: <${elementName}>.${name} has "notify" enabled, two-way bindings goes against Redux's paradigm.`);
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
		const update = state => {
			const mappedState = mapStateToProps ? mapStateToProps(state) : {};
			const updates = bindings.reduce((props, name) => {
				const statePath = properties[name].statePath;
				const value = (typeof statePath === 'function') ?
					statePath.call(element, state) :
					Polymer.Path.get(state, statePath);

				// Warn about double bindings
				if (props[name]) {
					console.warn(`PolymerRedux: <${elementName}>.${name} has double bindings, statePath binding has priority.`);
				}

				return Object.assign({}, props, {[name]: value});
			}, mappedState);

			element.setProperties(updates, true);
		};

		// Redux listener
		const unsubscribe = store.subscribe(() => {
			const detail = store.getState();
			update(detail);

			element.dispatchEvent(new CustomEvent('state-changed', {detail}));
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
	const unbind = element => {
		const off = subscribers.get(element);
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
	const collect = (what, which) => {
		let res = {};
		while (what) {
			res = Object.assign({}, what[which], res); // Respect prototype priority
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
		Object.keys(listeners).forEach(name => {
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
		Object.keys(listeners).forEach(name => {
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
				super();

				// Collect the action creators first as property changes trigger
				// dispatches from observers, see #65, #66, #67
				const reduxActions = collect(this.constructor, 'actions');

				// If we have any mapped events to dispatch, build the liseners object
				const mappedEvents = mapEventsToDispatch ?
					mapEventsToDispatch((...args) => this.dispatch(...args)) :
					{};

				// Bind the listeners to call with the event and the current state
				const reduxMappedListeners = Object.keys(mappedEvents).reduce((listeners, name) => {
					return Object.assign({}, listeners, {
						[name](event) {
							event.stopImmediatePropagation();
							mappedEvents[name](event, store.getState());
						}
					});
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
				const properties = collect(this.constructor, 'properties');
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
			dispatch(...args) {
				const actions = this._reduxActions;

				// Action creator
				let [action] = args;
				if (typeof action === 'string') {
					if (typeof actions[action] !== 'function') {
						throw new TypeError(`PolymerRedux: <${this.constructor.is}> invalid action creator "${action}"`);
					}
					action = actions[action](...args.slice(1));
				}

				// Proxy async dispatch
				if (typeof action === 'function') {
					const originalAction = action;
					action = (...args) => {
						// Replace redux dispatch
						args.splice(0, 1, (...args) => {
							return this.dispatch(...args);
						});
						return originalAction(...args);
					};

					// Copy props from the original action to the proxy.
					// see https://github.com/tur-nr/polymer-redux/issues/98
					Object.keys(originalAction).forEach(prop => {
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
