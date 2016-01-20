# Polymer Redux

Polymer bindings for Redux. Bind store state to properties and dispatch
actions from within Polymer Elements.

Polymer is a modern library for creating Web Components within an application.
Redux is a state container for managing predictable data. Binding the two
libraries together allows developers to create powerful and complex
applications faster and simpler. This approach allows the components you build
with Polymer to be more focused on functionality than the applications state.

## Installation

```bash
bower install --save polymer-redux
```

## Usage

### Boilerplate

Before importing Polymer Redux you must first include Redux to the applications
document.

```html
<html>
    <head>
        <script src="./bower_components/webcomponentsjs/webcomponents.js"></script>
        <script src="./node_modules/redux/dist/redux.js"></script>
        <script src="./bower_components/polymer-redux/polymer-redux.js"></script>        
    </head>
    <body>
        <!-- app -->
    </body>
</html>
```

### Setup

To bind Polymer components with Redux you must first create a ReduxBehavior
which wraps your application's store and decorates your elements. Simply set up
your Redux store as usual and then create the behavior with the `PolymerRedux`
constructor passing the store.

```javascript
var store = Redux.createStore(function(state, action) {
    return state;
});
var ReduxBehavior = new PolymerRedux(store);
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
the `created` callback. To bind a property to a value in the state set the 
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

#### Two-way Bindings

Principle #2 of Redux's [Three Principles](http://redux.js.org/docs/introduction/ThreePrinciples.html),
says that state is read-only. Polymer however allows components to have two-way
binding via the `notify` flag. If the properties flagged with `notify` and have
`statePath` set, you will recieve a warning in your application runtime.

### Dispatching Actions

For an easier and semanatic way to dispatch actions against the store, is to create a list of actions the component can trigger. Adding a list of functions to the `actions` property, exposes them to the `dispatch()` method of the element.

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

`dispatch()` also takes a function that returns a action object, or the standard redux way.

```javascript
Polymer({
    handleClick: function() {
        this.dispatch(function() {
            return {
               type: 'ACTION'
            };
        });
        // or
        this.dispatch({
            type: 'ACTION'
        });
    }
});
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


##### `#dispatch(<fn>)`

* `fn` Function, returning action object.

Returns the action object.


##### `#dispatch(<action>)`

* `action` Object, the action object.

Returns the action object.


#### Events

##### `state-changed`

Fires when the store's state has changed.

## License

[MIT](LICENSE)
