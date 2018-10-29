# Polymer Redux

[![Build Status](https://travis-ci.org/tur-nr/polymer-redux.svg?branch=master)](https://travis-ci.org/tur-nr/polymer-redux)
[![Coverage Status](https://coveralls.io/repos/github/tur-nr/polymer-redux/badge.svg?branch=master)](https://coveralls.io/github/tur-nr/polymer-redux?branch=master)

Polymer bindings for Redux. Bind store state to properties and dispatch
actions from within Polymer Elements.

Polymer is a modern library for creating Web Components within an application.
Redux is a state container for managing predictable data. Binding the two
libraries together allows developers to create powerful and complex
applications faster and simpler. This approach allows the elements you build
with Polymer to be more focused on functionality than the applications state.

## Installation

### Polymer 3.0

```bash
npm install --save polymer-redux@next
```

### Polymer <= 2

If an older version of Polymer is required for a project install the standard package below and refer to the [current documentation](https://tur-nr.github.io/polymer-redux).

```bash
npm install --save polymer-redux
```

## Example

```javascript
import { createMixin } from 'polymer-redux';
import { html, PolymerElement } from '@polymer/polymer/polymer-element';
import store from './redux/store';

// Create an instance of ReduxMixin
const ReduxMixin = createMixin(store);

// Create an element with the ReduxMixin
class AcmeHello extends ReduxMixin(PolymerElement) {
    static get template() {
        return html`
            <h1>Hello, [[name]]!</h1>
        `;
    }

    static get properties() {
        return {
            name: {
                type: String,
                readOnly: true
            }
        };
    }

    // Return element properties from the store's state
    static mapStateToProps(state, element) {
        return {
            name: state.name
        };
    }
}

// Define the Element
customElements.define('acme-hello', AcmeHello);
```

`<acme-hello />` is now connected to Redux and can sync element properties to the store's state.

## Documentation

##### ⚠️ WARNING

Before choosing Redux as a projects state management solution. It is important to know the limitations it brings to Polymer, see [Caveats](#caveats).

### The Redux Mixin

Polymer uses [class mixins](http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes) to extend and reuse functionality across elements. Polymer Redux uses this techinque to connect any extending element to a Redux store.

#### Creating A Mixin

Polymer Redux exports `createMixin` factory. This factory function is used to create a Redux mixin for Polymer elements to extend.

```javascript
import { createMixin } from 'polymer-redux';
import { createStore } from 'redux';

const store = createStore(state => state);
const ReduxMixin = createMixin(store);
```

#### Multiple Stores & Mixins

If an application relies on multiple stores, simply create as many mixins.

```javascript
const ReduxMixinOne = createMixin(storeOne);
const ReduxMixinTwo = createMixin(storeTwo);
const ReduxMixinX = createMixin(storeX);
```

### Binding State to Properties

Elements that extend the Redux mixin can now implement `static mapStateToProps(state, element)`. This method provides the logic for syncing the store's state to properties.

```javascript
class AcmeUser extends ReduxMixin(ParentElement) {
    static get properties() {
        return {
            name: {
                type: String,
                readOnly: true
            }
        };
    }

    static mapStateToProps(state, element) {
        return {
            name: state.name
        };
    }
}
```

It's considered good practice to define properties that will be mapped to Redux as `readOnly`. This helps stop any updates outside of Redux.

#### Dynamic Mapping

`mapStateToProps` accepts two arguments, `state` and `element`. Using existing properties from the element with `notify` enabled, elements can react from both Polymer and Redux state changes.

```javascript
class AcmeUser extends ReduxMixin(ParentElement) {
    static get properties() {
        return {
            userId: {
                type: String,
                notify: true
            },
            name: {
                type: String,
                readOnly: true
            }
        };
    }

    static mapStateToProps(state, element) {
        return {
            name: state.users[element.userId]
        };
    }
}
```

Use this feature with caution. Notifying properties that have Redux bindings associated with them can cause a double updates.

#### Selectors

Using selector libraries like [Reselect](https://github.com/reduxjs/reselect) can help with performance when mapping state to an element.

```javascript
import { createSelector } from 'reselect';

const currentUserId = state => state.session.userId;
const userObjects = state => state.data.users;

const getCurrentUser = createSelector(
    [currentUserId, userObjects],
    (id, users) => users[id]
);

class AcmeUser extends ReduxMixin(ParentElement) {
    static mapStateToProps(state, element) {
        return {
            user: getCurrentUser(state)
        };
    }
}
```

### Dispatching Actions

Along with binding properties elements can also dispatch actions to the Redux store. Elements can implement `static mapDispatchToEvents(dispatch, element)` which allows custom events to dispatch actions.

```javascript
class AcmeTodo extends ReduxMixin(PolymerElement) {
    static get template() {
        return html`
            <div>
                <input type="checkbox" on-change="handleDone" checked$="[[done]]" />
                <span>[[task]]</span>
            </div>
        `;
    }

    static get properties() {
        return {
            task: {
                type: String,
                readOnly: true
            },
            done: {
                type: Boolean,
                readOnly: true
            }
        };
    }

    static mapStateToProps(state) {
        return {
            task: state.task,
            done: state.done
        };
    }

    static mapDispatchToEvents(dispatch, element) {
        return {
            updateTodo: event => dispatch({
                type: 'UPDATE_TODO',
                done: event.detail
            });
        };
    }

    handleDone(event) {
        this.dispatchEvent(
            new CustomEvent('update-todo', {
                detail: event.target.checked
            })
        );
    }
}
```

In the element example above, the returning object from `static mapDispatchToEvents` is used to add event listeners to the element. When the events are fired the corresponding action will be dispatched to the Redux store. This may seem like it's just retargeting an event but it introduces [_Connected_ elements](#connected-elements).

The object keys will become the event name but in dash-case. So `updateTodo` will listen for `update-todo` events.

#### Bind Action Creators Helper

Polymer Redux exports a helper function that can bind the dispatch call to each event handler. Using the helper listeners now just need to return the action and Polymer Redux will handle the dispatching for that element.

```javascript
import { bindActionCreators } from 'polymer-redux';

class AcmeTodo extends ReduxMixin(PolymerElement) {
    static mapDispatchToEvents(dispatch, element) {
        return bindActionCreators(
            {
                updateTodo: event => ({
                    type: 'UPDATE_TODO',
                    done: event.detail
                })
            },
            dispatch
        );
    }
}
```

#### Manual Dispatch

Elements that extend the Redux mixin inherit the `dispatchAction` method. This method is a proxy for the Redux dispatch function and can be used just like in Redux.

```javascript
class AcmeTodo extends ReduxMixin(PolymerElement) {
    handleDone(event) {
        this.dispatchAction({
            type: 'UPDATE_TODO',
            done: event.detail
        });
    }
}
```

### Connected Elements

So far all the examples have been hybrid elements, meaning that an application is heavily coupled to Polymer Redux. What if the elements are already built or elements need to be decoupled for resusability? This is where connected elements helps.

A connected element holds the binding logic needed for Polymer Redux and nothing more. There is no element logic. This approach lets elements become more reusable and even been bound to another state management library. Use the base element as the parent class for the Redux mixin rather than the standard `PolymerElement`.

```javascript
// ./elements/acme-todo.js
export default class AcmeTodo extends PolymerElement {
    static get template() {
        return html`
            <div>
                <input type="checkbox" on-change="handleDone" checked$="[[done]]" />
                <span>[[task]]</span>
            </div>
        `;
    }

    static get properties() {
        return {
            task: {
                type: String,
                readOnly: true
            },
            done: {
                type: Boolean,
                readOnly: true
            }
        };
    }

    handleDone(event) {
        this.dispatchEvent(
            new CustomEvent('update-todo', {
                detail: event.target.checked
            })
        );
    }
}

// ./connected/acme-todo.js
import AcmeTodo from '../elements/acme-todo';

export default class ConnectedTodo extends PolymerRedux(AcmeTodo) {
    static mapStateToProps(state) {
        return {
            task: state.task,
            done: state.done
        };
    }

    static mapDispatchToEvents(dispatch, element) {
        return {
            updateTodo: event => dispatch({
                type: 'UPDATE_TODO',
                done: event.detail
            });
        };
    }
}
```

Now `AcmeTodo` is not tied to Polymer Redux anymore, it's a standard Polymer element that can be used in any Polymer project. If the project is using Polymer Redux then using `ConnectedTodo` will be the same element but with Redux bindings.

### Caveats

#### Observing Arrays and Sub-properties

Observing array mutations and sub property updates does not work with Polymer Redux. Redux state is immutable by design, reducers must always return new state. This means that when mutating arrays or objects your reducer will look something similar to below.

```javascript
const reducer = (state, action) => {
    switch (action.type) {
        case 'push':
            return {
                ...state,
                array: [...state.array, action.value]
            };

        case 'sub-prop':
            return {
                ...state,
                object: {
                    ...state.object,
                    subProp: action.value
                }
            };
    }
};
```

As you can see `state.object` and `state.array` are completely new instances. When using Polymer Redux to bind these properties it will set the new value to the Element's property. The property effects of Polymer is that of a new value and not a splice or sub property change.

## Todo Demo

For a working todo list using Polymer Redux check out the demos of this project.

```
npm run demo
```

## License

[MIT](LICENSE)

Copyright (c) 2018 [Christopher Turner](https://github.com/tur-nr)
