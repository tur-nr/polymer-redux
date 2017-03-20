/**
 * Polymer Redux
 *
 * Creates a Class mixin for decorating Elements with a given Redux store.
 *
 * @param {Object} store Redux store.
 * @return {Function} Class mixin.
 */
export default store => {
	const subscribers = new Map();

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
	const bind = (element, properties) => {
		if (subscribers.has(element)) {
			return;
		}

		const bindings = Object.keys(properties)
			.filter(name => {
				const property = properties[name];
				if (Object.prototype.hasOwnProperty.call(properties, 'statePath')) {
					if (!property.readOnly && property.notify) {
						console.warn(`PolymerRedux: <${element.constructor.is}>.${name} has "notify" enabled, two-way bindings goes against Redux's paradigm`);
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
			bindings.forEach(name => {
				const {statePath, readOnly} = properties[name];
				const value = (typeof statePath === 'function') ?
					statePath.call(element, state) :
					Polymer.Path.get(state, statePath);

				if (readOnly) {
					element._setProperty(name, value);
				} else {
					element[name] = value;
				}
			});
		};

		// Redux listener
		const unsubscribe = store.subscribe(() => {
			const detail = store.getState();
			update(detail);

			element.dispatchEvent(new CustomEvent('state-changed', {detail}));
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
			res = {...what[which], res}; // Respect prototype priority
			what = Object.getPrototypeOf(what);
		}
		return res;
	};

	/**
	 * Redux Mixin
	 *
	 * @example
	 *     const ReduxMixin = PolymerRedux(store)
	 *     class Foo extends ReduxMixin(Polymer.Element) { }
	 *
	 * @param {Polymer.Element|HTMLElement} parent The polymer parent element.
	 * @return {Function} PolymerRedux mixed class.
	 */
	return parent => class extends parent {
		connectedCallback() {
			super.connectedCallback();

			const properties = collect(this.constructor, 'properties');
			bind(this, properties);

			const actions = collect(this.constructor, 'actions');
			Object.defineProperty(this, '_reduxActions', {
				value: actions
			});
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
		dispatch(...args) {
			const actions = this._reduxActions;

			// Action creator
			let [action] = args;
			if (typeof action === 'string') {
				if (!actions || typeof actions[action] !== 'function') {
					throw new TypeError(`PolymerRedux: <${this.constructor.is}> has no action creator "${action}"`);
				}
				action = actions[action].apply(this.constructor, args.slice(1));
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
