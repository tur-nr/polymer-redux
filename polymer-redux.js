import './process-env';
import { html, PolymerElement } from '@polymer/polymer/polymer-element.js';
import { createStore } from 'redux';

const subscribers = new Map();

function isFunction(fn) {
	return typeof fn === 'function';
}

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

function bindToReduxStore(store, element) {
	const Definition = element.constructor;

	const unsubscribe = store.subscribe(function() {
		const state = store.getState();
		updateProperties(state);
		element.dispatchEvent(new CustomEvent('state-changed', { detail: state }));
	});

	const listeners = isFunction(Definition.mapDispatchToEvents)
		? Definition.mapDispatchToEvents(store.dispatch)
		: null;
	const events = listeners != null ? Object.keys(listeners) : [];

	events.forEach(function(name) {
		element.addEventListener(name, listeners[name]);
	});

	subscribers.set(element, () => {
		unsubscribe();
		events.forEach(function(name) {
			element.removeEventListener(name, listeners[name]);
		});
	});

	updateProperties();

	function updateProperties(state = store.getState()) {
		if (isFunction(Definition.mapStateToProps)) {
			const properties = Definition.mapStateToProps(state);
			element.setProperties(properties, true);
		}
	}
}

function releaseFromReduxStore(element) {
	const unsubscribe = subscribers.get(element);
	if (unsubscribe) {
		unsubscribe();
	}
}

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
		};
}

const store = createStore((state = { name: 'Chris' }, action) => {
	switch (action.type) {
		case 'UPDATE_NAME':
			return Object.assign({}, state, {
				name: action.name
			});
		default:
			return state;
	}
});

const ReduxMixin = createReduxMixin(store);

class PolymerRedux extends ReduxMixin(PolymerElement) {
	static mapStateToProps(state) {
		return {
			name: state.name
		};
	}

	static mapDispatchToEvents(dispatch) {
		return {
			updateName(event) {
				dispatch({
					type: 'UPDATE_NAME',
					name: event.detail
				});
			}
		};
	}

	static get template() {
		return html`
      <style>
        :host {
          display: block;
        }
      </style>
			<h2>Hello [[name]]!</h2>
			<button on-click="_updateName">Update Name</button>
    `;
	}

	static get properties() {
		return {
			name: String
		};
	}

	_updateName() {
		this.dispatchEvent(
			new CustomEvent('updateName', {
				detail: 'Chutima'
			})
		);
	}
}

window.customElements.define('polymer-redux', PolymerRedux);
