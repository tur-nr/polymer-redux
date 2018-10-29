import { createMixin } from '../../polymer-redux';
import { createStore } from 'redux';

const initial = {
    count: 0
};

const reducer = (state = initial, action) => {
    switch (action.type) {
        case 'increment':
            return Object.assign({}, state, {
                count: state.count + 1
            });
        default:
            return state;
    }
};

const store = createStore(reducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

export default createMixin(store);