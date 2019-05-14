import './process-env';
import { camelToDashCase } from '@polymer/polymer/lib/utils/case-map';

/**
 * Polymer private property for registering notify effects on an instance.
 */
const NOTIFY_EFFECTS = '__notifyEffects';

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
 * @param {HTMLElement} element Element instance.
 * @param {Map<HTMLElement, Function>} registry Redux bindings registry.
 */
function bindToReduxStore(store, element, registry) {
	const Definition = element.constructor;

	const updateProperties = () => {
		if (typeof Definition.mapStateToProps === 'function') {
			const properties = Definition.mapStateToProps(
				store.getState(),
				element
			);

			if (properties) {
				element.setProperties(properties, true);
			}
		}
	};

	const unsubscribe = store.subscribe(() => {
		updateProperties();

		element.dispatchEvent(
			new CustomEvent('state-changed', {
				detail: store.getState()
			})
		);
	});

	const removeListeners = addEventListeners(store, element);
	const removeEffects = addEffectListeners(store, element, updateProperties);

	registry.set(element, () => {
		unsubscribe();
		removeListeners();
		removeEffects();
	});

	updateProperties();
}

/**
 * Adds all `mapDispatchToEvents` event listeners on an element.
 *
 * @param {Object} store Redux store.
 * @param {HTMLElement} element Element instance.
 * @return {Function} A callback that will remove all listeners from instance.
 */
function addEventListeners(store, element) {
	const Definition = element.constructor;

	const listeners =
		typeof Definition.mapDispatchToEvents === 'function'
			? Definition.mapDispatchToEvents(store.dispatch, element)
			: null;

	const events = (listeners != null ? Object.keys(listeners) : []).map(
		name => {
			return {
				event: camelToDashCase(name),
				handler: listeners[name]
			};
		}
	);

	events.forEach(event =>
		element.addEventListener(event.event, event.handler)
	);

	return () =>
		events.forEach(event =>
			element.removeEventListener(event.event, event.handler)
		);
}

/**
 * Adds event listeners for element effects to update from Redux store.
 *
 * @param {Object} store Redux store.
 * @param {HTMLElement} element Element instance.
 * @param {Function} update Callback to update element properties.
 * @return {Function} Callback to remove all effect listeners.
 */
function addEffectListeners(store, element, update) {
	const notifyEffects = element[NOTIFY_EFFECTS];

	const notifications = notifyEffects
		? Object.keys(notifyEffects).map(
				name => `${camelToDashCase(name)}-changed`
		  )
		: [];

	notifications.forEach(name => element.addEventListener(name, update));

	return () =>
		notifications.forEach(name =>
			element.removeEventListener(name, update)
		);
}

/**
 * Releases element from any Redux bindings.
 *
 * @param {HTMLElement} element Element instance.
 * @param {Map<HTMLElement, Function>} registry Redux bindings registry.
 */
function releaseFromReduxStore(element, registry) {
	const unsubscribe = registry.get(element);

	if (unsubscribe) {
		unsubscribe();
	}

	registry.delete(element);
}

/**
 * Creates a mixin for a given Redux store.
 *
 * @param {Object} store Redux store instance.
 * @return {Class}
 */
export function createMixin(store) {
	assertReduxStore(store);

	const registry = new Map();

	return Parent =>
		class ReduxMixin extends Parent {
			connectedCallback() {
				bindToReduxStore(store, this, registry);
				super.connectedCallback();
			}

			disconnectedCallback() {
				releaseFromReduxStore(this, registry);
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

export default createMixin;

/**
 * Binds a list of action creators to a dispatch function.
 *
 * @param {Object} actionCreators
 * @param {Function} dispatch
 * @param {Object} [options] Binding options.
 * @param {Boolean} [options.dashCase] Should event name be dash cased.
 * @return {Object}
 */
export function bindActionCreators(actionCreators, dispatch) {
	if (!actionCreators) {
		throw new TypeError(
			'Polymer Redux: Expecting "actionCreators" to be an enumerable.'
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
