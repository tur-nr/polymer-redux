import './process-env';

/**
 * Element bindings registry.
 *
 * @type {Map<HTMLElement, Function>}
 */
const registry = new Map();

/**
 * Is given argument a function.
 *
 * @param {any} fn
 * @return {Boolean}
 */
function isFunction(fn) {
	return typeof fn === 'function';
}

/**
 * Assert given value is a Redux store by ducktyping.
 *
 * @throws {TypeError} If given argument isn't an implmentation of Redux store.
 * @param {Object} store Redux store object.
 */
function assertReduxStore(store) {
	if (!store) {
		throw new TypeError('PolymerRedux: expecting a redux store.');
	} else if (
		!['getState', 'dispatch', 'subscribe'].every(
			k => typeof store[k] === 'function'
		)
	) {
		throw new TypeError('PolymerRedux: invalid store object.');
	}
}

/**
 * Binds an element to a given redux store.
 *
 * @param {Object} store Redux store.
 * @param {HTMLElement} element
 */
function bindToReduxStore(store, element) {
	const Definition = element.constructor;

	const updateProperties = state => {
		if (isFunction(Definition.mapStateToProps)) {
			const properties = Definition.mapStateToProps(state, element);
			element.setProperties(properties, true);
		}
	};

	const unsubscribe = store.subscribe(() => {
		const state = store.getState();
		updateProperties(state);

		element.dispatchEvent(
			new CustomEvent('state-changed', {
				detail: state,
				bubbles: true,
				composed: true
			})
		);
	});

	const listeners = isFunction(Definition.mapDispatchToEvents)
		? Definition.mapDispatchToEvents(store.dispatch, element)
		: null;
	const events = listeners != null ? Object.keys(listeners) : [];

	events.forEach(name => element.addEventListener(name, listeners[name]));

	registry.set(element, () => {
		unsubscribe();
		events.forEach(name =>
			element.removeEventListener(name, listeners[name])
		);
	});

	updateProperties(store.getState());
}

/**
 * Releases element from any Redux bindings.
 *
 * @param {HTMLElement} element
 */
function releaseFromReduxStore(element) {
	const unsubscribe = registry.get(element);
	if (unsubscribe) {
		unsubscribe();
	}
}

/**
 * Creates a mixin for a given Redux store.
 *
 * @param {Object} store Redux store instance.
 * @return {Class}
 */
export function createReduxMixin(store) {
	assertReduxStore(store);

	return Parent =>
		class ReduxMixin extends Parent {
			connectedCallback() {
				bindToReduxStore(store, this);
				super.connectedCallback();
			}

			disconnectedCallback() {
				releaseFromReduxStore(this);
				super.disconnectedCallback();
			}

			getState() {
				return store.getState();
			}

			dispatchAction() {
				return store.dispatch.apply(store, arguments);
			}
		};
}

export default createReduxMixin;

/**
 * Binds a list of action creators to a dispatch function.
 *
 * @param {Object} actionCreators
 * @param {Function} dispatch
 * @return {Object}
 */
export function bindActionCreators(actionCreators, dispatch) {
	if (!actionCreators) {
		throw new TypeError(
			'PolymerRedux: Expecting "actionCreators" to be an enumerable.'
		);
	}

	return Object.keys(actionCreators).reduce((actions, name) => {
		return Object.assign(actions, {
			[name]: function() {
				return dispatch(actionCreators[name].apply(this, arguments));
			}
		});
	}, {});
}
