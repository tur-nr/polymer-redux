((factory) => {
    /* istanbul ignore next */
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        this.PolymerRedux = factory();
    }
})(() => {
    return (store) => {
        const subscribers = new Map();

        const bindStore = (element, properties) => {
            if (subscribers.has(element)) return;

            const bindings = Object.keys(properties)
                .filter((name) => properties[name].hasOwnProperty('statePath'));

            const bind = (state) => {
                bindings.forEach((name) => {
                    const { statePath, readOnly } = properties[name];
                    const value = (typeof statePath === 'function')
                        ? statePath.call(element, state)
                        : Polymer.Path.get(state, statePath);

                    if (readOnly) {
                        element._setProperty(name, value);
                    } else {
                        element[name] = value;
                    }
                });
            };

            bind(store.getState());

            const off = store.subscribe(() => {
                const state = store.getState();

                bind(state);

                element.dispatchEvent(new CustomEvent('state-changed', {
                    detail: state,
                    bubbles: true
                }));
            });

            subscribers.set(element, off);
        };

        const unbindStore = (element) => {
            const off = subscribers.get(element);
            if (typeof off === 'function') off();
        };

        return (parent) => class extends parent {
            constructor() {
                super();

                // property bindings
                const config = this.constructor.config;
                const properties = config && config.properties;
                bindStore(this, properties || {});
            }

            getState() {
                return store.getState();
            }

            dispatch(action) {
                const Element = this.constructor;
                const config = Element.config;
                const actions = config && config.actions;

                // action creator
                if (typeof action === 'string') {
                    if (!actions || typeof actions[action] !== 'function') {
                        throw new TypeError(`PolymerRedux: <${Element.is}> has no action creator "${action}"`);
                    }
                    action = actions[action].apply(Element, args.slice(1));
                }

                return store.dispatch(action);
            }
        };
    };
});