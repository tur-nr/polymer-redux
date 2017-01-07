# Polymer Redux

[![Build Status](https://travis-ci.org/tur-nr/polymer-redux.svg?branch=master)](https://travis-ci.org/tur-nr/polymer-redux)
[![Coverage Status](https://coveralls.io/repos/github/tur-nr/polymer-redux/badge.svg?branch=master)](https://coveralls.io/github/tur-nr/polymer-redux?branch=master)

Polymer bindings for Redux. Bind store state to properties and dispatch
actions from within Polymer Elements.

Polymer is a modern library for creating Web Components within an application.
Redux is a state container for managing predictable data. Binding the two
libraries together allows developers to create powerful and complex
applications faster and simpler. This approach allows the components you build
with Polymer to be more focused on functionality than the applications state.

## Polymer 2.0 Preview

The Polymer team have released a preview of it's next major update, [Polymer 2.0](https://www.polymer-project.org/1.0/blog/2016-09-09-polymer-2.0). With this update comes a cleaner interface for setting properties on elements which is perfect for state management libraries like Redux.

Checkout [`polymer-2`](https://github.com/tur-nr/polymer-redux/tree/polymer-2) branch to have a play with PolymerRedux and Polymer 2.0.

## Installation

```bash
bower install --save polymer-redux
```

## Usage

### Setup

To bind Polymer components with Redux you must first create a ReduxBehavior
which wraps your application's store and decorates your elements. Simply set up
your Redux store as usual and then create the behavior with the `PolymerRedux`
factory, passing the store.

```javascript
var store = Redux.createStore(function(state, action) {
    return state;
});
var ReduxBehavior = PolymerRedux(store);
var MyElement = Polymer({
    is: 'my-element',
    behaviors: [ ReduxBehavior ],
    created: function() {
        var state = this.getState();
    }
});
```
Now `MyElement` has a connection to the Redux store and can bind properties to
it's state and dispatch actions.

### Binding Properties

Polymer Redux binds state to the components properties. This binding happens on
the `ready` callback. To bind a property to a value in the state set the
`statePath` key when defining properties in Polymer.

```javascript
Polymer({
    is: 'my-element',
    behaviors: [ ReduxBehavior ],
    properties: {
        message: {
            type: String,
            statePath: 'message'
        }
    }
});
```

`<MyElement>.message` is now bound to the value of `message` in the state.
Whenever the store state changes so to will the properties of the element.

#### Dot Notation

Binding properties this way makes use of [`Polymer.Base.get()`](http://polymer.github.io/polymer/) method, so you can use dot notation paths like so: `'user.firstName'`.


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
Polymer({
    is: 'my-element',
    behaviors: [ ReduxBehavior ],
    properties: {
        todo: {
            type: String,
            statePath: function(state) { return state.todosById[state.todoToEdit] }
        }
    }
});
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
Polymer({
    properties: {
        todo: {
            type: String,
            statePath: editTodoSelector
        }
    }
})
```

Just be aware when using selectors, they are an optimisation utility. When mutating objects or arrays, be sure to return a new instance or the selector will return cached response and the element won't update. Polymer is already optimised to calculate the minimal changes to properties so you may not need selectors.

#### Two-way Bindings

Principle #2 of Redux's [Three Principles](http://redux.js.org/docs/introduction/ThreePrinciples.html),
says that state is read-only. Polymer however allows components to have two-way
binding via the `notify` flag. If the properties flagged with `notify` and have
`statePath` set, you will receive a warning in your application runtime.

### Dispatching Actions

For an easier and semantic way to dispatch actions against the store, is to create a list of actions the component can trigger. Adding a list of functions to the `actions` property, exposes them to the `dispatch()` method of the element.

```javascript
Polymer({
    actions: {
        setName: function(first, last) {
            return {
                type: 'SET_NAME',
                first: first,
                last: last
            };
        }
    },
    handleClick: function() {
        return this.dispatch('setName', 'James', 'Bond');
    }
});
```

~~`dispatch()` also takes a function that returns an action object. This function must have a length of zero, otherwise it will pass the function to Redux as middleware function. Or you may use the standard Redux way of dispatching.~~

**DEPRECATED** _The following example of dispatching actions will be removed in the next major release._

```javascript
Polymer({
    handleClick: function() {
        this.dispatch(function() { // !!! ZERO LENGTH !!!
            return {
               type: 'ACTION'
            };
        });
        // or the standard redux way
        this.dispatch({
            type: 'ACTION'
        });
    }
});
```

#### Dispatching Async Actions

When you need to dispatch Async with [redux-thunk](https://github.com/gaearon/redux-thunk) actions it is good practice to use `dispatch()` like so.

```javascript
Polymer({
    handleClick: function() {
        this.dispatch(function(dispatch) {
            dispatch({ type: 'REQUEST_STARTED' });
            // do async task
            setTimeout(function() {
                dispatch({ type: 'REQUEST_ENDED' })
            }, 1000);
        });
    }
})
```

## API

#### PolymerRedux

##### `new PolymerRedux(<store>)`

* `store` Object, Redux store.

Returns a `ReduxBehavior` object.

#### Redux Behavior

These methods are available on the instance of the component, the element.

##### `#getState()`

Returns current store's state.

##### `#dispatch(<name>, [args, ...])`

* `name` String, action name in the actions list.
* `arg...` *, Arguments to pass to action function.

Returns the action object.


##### ~~`#dispatch(<fn>)`~~

* ~~`fn` Function, returning action object.~~

~~`fn` must be of length zero to use `#dispatch()` this way.~~

~~Returns the action object.~~


##### `#dispatch(<fn>)`

* `fn` Function, returning action object.

`fn` must have at least a length of one to use `#dispatch` as a middleware.

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
