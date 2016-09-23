/**
 * Polymer Redux
 *
 * Creates a Class mixin for decorating Elements with a given Redux store.
 *
 * @param {Object} store Redux store.
 * @return {Function} Class mixin.
 */
export default (store) => {
    const subscribers = new Map()

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
        if (subscribers.has(element)) return

        const bindings = Object.keys(properties)
            .filter((name) => properties[name].hasOwnProperty('statePath'))

        /**
         * Updates an element's properties with the given state.
         *
         * @private
         * @param {Object} state
         */
        const update = (state) => {
            bindings.forEach((name) => {
                const { statePath, readOnly } = properties[name]
                const value = (typeof statePath === 'function')
                    ? statePath.call(element, state)
                    : Polymer.Path.get(state, statePath)

                if (readOnly) {
                    element._setProperty(name, value)
                } else {
                    element[name] = value
                }
            })
        }

        // redux listener
        const unsubscribe = store.subscribe(() => {
            const state = store.getState()
            update(state)

            element.dispatchEvent(new CustomEvent('state-changed', {
                detail: state
            }))
        })

        subscribers.set(element, unsubscribe)

        return update
    }

    /**
     * Unbinds an element from state changes in the Redux store.
     *
     * @private
     * @param {HTMLElement} element
     */
    const unbind = (element) => {
        const off = subscribers.get(element)
        if (typeof off === 'function') off()
    }

    /**
     * Redux Mixin
     *
     * @example
     *     const ReduxMixin = PolymerRedux(store)
     *     class Foo extends ReduxMixin(Polymer.Element) { }
     *
     * @param {Polymer.Element} parent The polymer parent element.
     * @return {Function} PolymerRedux mixed class.
     */
    return (parent) => class extends parent {
        constructor() {
            super()
            this._bindPropertiesToReduxStore()
        }

        connectedCallback() {
            this._bindPropertiesToReduxStore()
        }

        disconnectedCallback() {
            unbind(this)
        }

        /**
         * Binds properties of element to the Redux store.
         *
         * @private
         */
        _bindPropertiesToReduxStore() {
            // bind properties
            const config = this.constructor.config
            const properties = config && config.properties
            const update = bind(this, properties || {})

            update(store.getState()) // init
        }

        /**
         * Returns the Redux store's current state.
         *
         * @return {*}
         */
        getState() {
            return store.getState()
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
            const config = this.constructor.config
            const actions = config && config.actions

            // action creator
            let [ action ] = args
            if (typeof action === 'string') {
                if (!actions || typeof actions[action] !== 'function') {
                    throw new TypeError(`PolymerRedux: <${this.constructor.is}> has no action creator "${action}"`)
                }
                action = actions[action].apply(this.constructor, args.slice(1))
            }

            return store.dispatch(action)
        }
    }
}
