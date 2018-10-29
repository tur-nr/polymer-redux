import { PolymerElement, html } from '@polymer/polymer/polymer-element'
import reduxMixin from './redux-mixin';
import { bindActionCreators } from 'redux';

class UnconnectedCounter extends PolymerElement {

    static get template() {

        return html`
        <div>
            <span style="color:green">count: [[count]]</span>
            <button on-click="handleIncrement">increment</button>
        </div>
        `
    }

    static get properties() {
        return {
            count: Number,
        };
    }

    constructor() {
        super();
        this.count = 0;
    }

    handleIncrement(value) {
        this.dispatchEvent(new CustomEvent('increment', { detail: value }));
    }

}
customElements.define('unconnected-counter', UnconnectedCounter);


class ReduxCounterBase extends reduxMixin(UnconnectedCounter) {

    static mapStateToProps(state, element) {
        return {
            count: state.count
        };
    }

    static mapDispatchToEvents(dispatch, element) {
        return {
            increment: (event) => dispatch({
                type: 'increment',
            }),
        };
    }
}
customElements.define('redux-counter-base', ReduxCounterBase);


class ReduxCounterBind extends reduxMixin(UnconnectedCounter) {

    static mapStateToProps(state, element) {
        return {
            count: state.count
        };
    }

    static mapDispatchToEvents(dispatch, element) {
        return bindActionCreators(
            {
                increment(event) {
                    return {
                        type: 'increment',
                    };
                },
            },
            dispatch
        );
    }
}
customElements.define('redux-counter-bind', ReduxCounterBind);