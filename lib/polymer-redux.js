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
    const subscribers = new Map();

    return (store) => (parent) => class extends parent {
        constructor() {
            super();

            // elements config
            const config = this.constructor.config;
            const properties = config && config.properties;

            // no properties to bind
            if (!properties) return;
        }

        getState() {
            return store.getState();
        }
    };
});