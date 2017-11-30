import window from 'global/window';
import konsole from 'global/console';
import PolymerRedux from '../src';

jest.mock('global/window', () => ({
	CustomEvent: jest.fn(),
	Polymer: {
		Path: {
			get: jest.fn()
		}
	}
}));

jest.mock('global/console', () => ({
	warn: jest.fn()
}));

const store = {
	getState: jest.fn(),
	dispatch: jest.fn(),
	subscribe: jest.fn()
};

const constructor = jest.fn();
const connectedCallback = jest.fn();
const disconnectedCallback = jest.fn();
const setPendingPropertyOrPath = jest.fn();
const invalidateProperties = jest.fn();
const dispatchEvent = jest.fn();

class Parent {
	constructor(...args) {
		constructor(...args);
	}

	connectedCallback() {
		return connectedCallback();
	}

	disconnectedCallback() {
		return disconnectedCallback();
	}

	_setPendingPropertyOrPath(...args) {
		return setPendingPropertyOrPath(...args);
	}

	_invalidateProperties() {
		return invalidateProperties();
	}

	dispatchEvent(...args) {
		dispatchEvent(...args);
	}
}

const statePath = jest.fn();

class ParentWithProps extends Parent {
	static get is() {
		return 'parent-props';
	}

	static get properties() {
		return {
			foo: {
				statePath: 'foo'
			},
			bar: {
				readOnly: true,
				statePath
			},
			baz: {
				notify: true,
				statePath: 'warning'
			},
			qux: {
				value: 'qux'
			}
		};
	}
}

describe('#PolymerRedux', () => {
	it('should be factory function', () => {
		expect(typeof PolymerRedux).toBe('function');
	});

	it('should throw TypeError if no store given', () => {
		expect(PolymerRedux).toThrow(/expecting a redux store/);
	});

	it('should throw TypeError if not a store', () => {
		expect(PolymerRedux.bind(undefined, {})).toThrow(/invalid store object/);
	});

	it('should return a Mixin factory', () => {
		expect(typeof PolymerRedux(store)).toBe('function');
	});

	describe('#ReduxMixin', () => {
		const ReduxMixin = PolymerRedux(store);

		it('should mix parent class with PolymerRedux', () => {
			const e = new (ReduxMixin(Parent))();
			expect(e).toBeInstanceOf(Parent);
		});

		describe('.constructor()', () => {
			it('should define ._reduxAction property', () => {
				const e = new (ReduxMixin(Parent))();
				expect(typeof e._reduxActions).toBe('object');
			});
		});

		describe('.connectedCallback()', () => {
			it('should subscribe to redux store', () => {
				const e = new (ReduxMixin(Parent))();
				e.connectedCallback();
				expect(store.subscribe).toHaveBeenCalled();
			});

			it('should call super.connectedCallback()', () => {
				const e = new (ReduxMixin(Parent))();
				e.connectedCallback();
				expect(connectedCallback).toHaveBeenCalled();
			});

			describe('bindings', () => {
				it('should have initial properties set with statePath', () => {
					window.Polymer.Path.get.mockReturnValueOnce('foo');
					setPendingPropertyOrPath.mockReturnValueOnce(true);

					const e = new (ReduxMixin(ParentWithProps))();
					e.connectedCallback();

					expect.assertions(2);

					expect(setPendingPropertyOrPath).toHaveBeenCalledWith('foo', 'foo', true)
					expect(invalidateProperties).toBeCalled();
				});

				it('should set readOnly property', () => {
					statePath.mockReturnValueOnce('bar');
					setPendingPropertyOrPath.mockReturnValueOnce(true);

					const e = new (ReduxMixin(ParentWithProps))();
					e.connectedCallback();

					expect(setPendingPropertyOrPath).toHaveBeenCalledWith('bar', 'bar', true);
				});

				it('should warn against two-way bindings notify option', () => {
					const e = new (ReduxMixin(ParentWithProps))();
					e.connectedCallback();
					expect(konsole.warn).toHaveBeenCalledWith(
						expect.stringMatching(/<parent-props>.baz has "notify" enabled/)
					);
				});
			});

			describe('store subscriber', () => {
				const element = new (ReduxMixin(ParentWithProps))();
				element.connectedCallback();
				const listener = store.subscribe.mock.calls[0][0];

				it('should get the state from the store', () => {
					listener();
					expect(store.getState).toHaveBeenCalled();
				});

				it('should create CustomEvent("state-changed", {detail: state})', () => {
					const detail = {};
					store.getState.mockReturnValueOnce(detail);
					listener();
					expect(window.CustomEvent).toHaveBeenCalledWith('state-changed', {detail});
				});

				it('should pass CustomEvent to .dispatchEvent()', () => {
					const event = {};
					window.CustomEvent.mockReturnValueOnce(() => event);
					listener();
					expect(dispatchEvent).toHaveBeenCalledWith(event);
				});
			});
		});

		describe('.disconnectedCallback()', () => {
			it('should call super.disconnectedCallback()', () => {
				const e = new (ReduxMixin(Parent))();
				e.disconnectedCallback();
				expect(disconnectedCallback).toHaveBeenCalled();
			});

			it('should call unsubscribe on .disconnectedCallback()', () => {
				const off = jest.fn();
				store.subscribe.mockReturnValueOnce(off);
				const e = new (ReduxMixin(Parent))();
				e.connectedCallback();
				e.disconnectedCallback();
				expect(off).toHaveBeenCalled();
			});
		});

		describe('.dispatch()', () => {
			it('should call store dispatch with given object', () => {
				const e = new (ReduxMixin(Parent))();
				const action = {};
				e.dispatch(action);
				expect(store.dispatch).toHaveBeenCalledWith(action);
			});

			describe('action creators', () => {
				const element = new (ReduxMixin(Parent))();
				// Mock internal _reduxAction
				element._reduxActions.foo = jest.fn();
				const action = {};

				it('should call action creator', () => {
					element.dispatch('foo', 'string', true, 1);
					expect(element._reduxActions.foo).toHaveBeenCalledWith('string', true, 1);
				});

				it('should call store dispatch with action creator return value', () => {
					element._reduxActions.foo.mockReturnValueOnce(action);
					element.dispatch('foo');
					expect(store.dispatch).toHaveBeenCalledWith(action);
				});

				it('should throw if action creator is not a function', () => {
					const e = new (ReduxMixin(Parent))();
					e._reduxActions.fail = null;
					expect(e.dispatch.bind(e, 'fail')).toThrow(/invalid action creator "fail"/);
				});

				it('should give proxy func if async', () => {
					const e = new (ReduxMixin(Parent))();
					const action = jest.fn();
					e.dispatch(action);
					expect(store.dispatch).not.toHaveBeenCalledWith(action);
				});

				it('should call original action from proxied async action', () => {
					const e = new (ReduxMixin(Parent))();
					const action = jest.fn();
					const dispatch = jest.fn();
					e.dispatch(action);

					const fn = store.dispatch.mock.calls[0][0];
					fn(dispatch);
					expect(action).not.toHaveBeenCalledWith(dispatch);
				});

				it('should proxied action should pass elements dispatch', () => {
					const e = new (ReduxMixin(Parent))();
					const action = jest.fn(dispatch => {
						dispatch('async');
					});
					e.dispatch(action);

					const fn = store.dispatch.mock.calls[0][0];
					e.dispatch = jest.fn();
					fn();
					expect(e.dispatch).toHaveBeenCalledWith('async');
				});
			});
		});

		describe('.getState()', () => {
			it('should return current redux state', () => {
				const e = new (ReduxMixin(Parent))();
				const state = {};
				store.getState.mockReturnValueOnce(state);
				expect(e.getState()).toBe(state);
			});
		});
	});
});
