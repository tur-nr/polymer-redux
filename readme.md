# Polymer Redux

[![Build Status](https://travis-ci.org/tur-nr/polymer-redux.svg?branch=polymer-2)](https://travis-ci.org/tur-nr/polymer-redux)
[![Coverage Status](https://coveralls.io/repos/github/tur-nr/polymer-redux/badge.svg?branch=polymer-2)](https://coveralls.io/github/tur-nr/polymer-redux?branch=polymer-2)

Polymer bindings for Redux. Bind store state to properties and dispatch
actions from within Polymer Elements.

Polymer is a modern library for creating Web Components within an application.
Redux is a state container for managing predictable data. Binding the two
libraries together allows developers to create powerful and complex
applications faster and simpler. This approach allows the components you build
with Polymer to be more focused on functionality than the applications state.

## Installation

```bash
bower install --save polymer-redux#polymer-2
```

## Usage

### Boilerplate

Before importing Polymer Redux you must first include Redux to the applications
document.

```html
<html>
    <head>
        <script src="./bower_components/webcomponentsjs/webcomponents-lite.js"></script>
        <script src="./node_modules/redux/dist/redux.js"></script>
        <link rel="import" href="./bower_components/polymer-redux/polymer-redux.html">
    </head>
    <body>
        <!-- app -->
    </body>
</html>
```

### Setup

To bind Polymer components with Redux you must first create a ReduxMixin which
binds your application's store to any Element passed in. Simply set up your
Redux store as usual and then create the class mixin with the `PolymerRedux`
factory passing the store.

```javascript
const store = Redux.createStore((state = {}, action) => state)
const ReduxMixin = PolymerRedux(store)
class MyElement extends ReduxMixin(Polymer.Element) {
    static get is() {
        return 'my-element'
    }

    connectedCallback() {
        super.connectedCallback();
        const state = this.getState();
    }
}
customElements.define(MyElement.is, MyElement)
```
Now `MyElement` has a connection to the Redux store and can bind properties to
it's state and dispatch actions.

### Binding Properties

Polymer Redux binds state to the components properties. This binding happens on
`connectedCallback`. To bind a property to a value in the state set the
`statePath` key when defining properties in Polymer.

```javascript
class MyElement extends ReduxMixin(Polymer.Element) {
    static get config() {
        return {
            properties: {
                message: {
                    type: String,
                    statePath: 'message'
                }
            }
        }
    }
}
```

`<MyElement>.message` is now bound to the value of `message` in the state.
Whenever the store state changes so to will the properties of the element.

#### Dot Notation

Binding properties this way makes use of [`Polymer.Path.get()`](http://polymer.github.io/polymer/) method, so you can use dot notation paths like so: `'user.firstName'`.


#### Dynamic Bindings

There are cases, when a static `statePath` can't be provided when defining properties in a Polymer element.

Take for example this state tree:

```javascript
{
    todoToEdit: 1,
    todosById:  {
        1: {'checked': false,'text': 'some text'},
        2: {'checked': true, 'text': 'some other text'},
        3: ....
    }
}
```

To create a Polymer element that allows you to edit a todo from the `todosById` object based on a key/id stored in the `todoToEdit` property, the binding has to be dynamic.
To allow these use cases the `statePath` can also take a `Function` instead of a `String`. The function will be called and the `state` will be passed into it as a parameter:

```javascript
class MyElement extends ReduxMixin(Polymer.Element) {
    static get config() {
        return {
            properties: {
                message: {
                    type: String,
                    statePath(state) {
                        return state.todosById[state.todoToEdit]
                    }
                }
            }
        }
    }
}
```

##### Selectors

The same way you use `statePath` as function, you can also give it a [selector](https://github.com/reactjs/reselect).

```javascript
const getTodos = state => state.todos;
const getEditId = state => state.todoToEdit;
const editTodoSelector = Reselect.createSelector(
    getTodos,
    getEditId,
    // we use a function to allow element binding
    function(todos, id) {
        return state.todosById[id];
    }
);
class MyElement extends ReduxMixin(Polymer.Element) {
    static get config() {
        return {
            properties: {
                message: {
                    type: String,
                    statePath: editTodoSelector
                }
            }
        }
    }
}
```

Just be aware when using selectors, they are an optimisation utility. When mutating objects or arrays, be sure to return a new instance or the selector will return cached response and the element won't update. Polymer is already optimised to calculate the minimal changes to properties so you may not need selectors.

#### Two-way Bindings

Principle #2 of Redux's [Three Principles](http://redux.js.org/docs/introduction/ThreePrinciples.html),
says that state is read-only. Polymer however allows components to have two-way
binding via the `notify` flag. If the properties flagged with `notify` and have
`statePath` set, you will recieve a warning in your application runtime.

### Dispatching Actions

For an easier and semantic way to dispatch actions against the store, is to create a list of actions the component can trigger. Adding a list of functions to the `actions` property, exposes them to the `dispatch()` method of the element.

```javascript
class MyElement extends ReduxMixin(Polymer.Element) {
    static get config() {
        return {
            actions: {
                setName(first, last) {
                    return {
                        type: 'SET_NAME',
                        first,
                        last
                    }
                }
            }
        }
    }

    handleClick() {
        return this.dispatch('setName', 'James', 'Bond');
    }
}
```

#### Dispatching Async Actions

When you need to dispatch Async with [redux-thunk](https://github.com/gaearon/redux-thunk) actions it is good practice to use `dispatch()` like so.

```javascript
class MyElement extends ReduxMixin(Polymer.Element) {
    handleClick() {
        return this.dispatch((dispatch) => {
            dispatch({ type: 'REQUEST_STARTED' })
            // do async task
            setTimeout(function() {
                dispatch({ type: 'REQUEST_ENDED' })
            }, 1000)
        })
    }
}
```

## API

#### PolymerRedux

##### `new PolymerRedux(<store>)`

* `store` Object, Redux store.

Returns a `ReduxMixin` function.

#### Redux Mixin

These methods are available on the instance of the component, the element.

##### `#getState()`

Returns current store's state.

##### `#dispatch(<name>, [args, ...])`

* `name` String, action name in the actions list.
* `arg...` *, Arguments to pass to action function.

Returns the action object.


##### `#dispatch(<fn>)`

* `fn` Function, Redux middleware dispatch function.

Returns the action object.


##### `#dispatch(<action>)`

* `action` Object, the action object.

Returns the action object.


#### Events

##### `state-changed`

Fires when the store's state has changed.

## License

[MIT](LICENSE)

Copyright (c) 2016 [Christopher Turner](https://github.com/tur-nr)
