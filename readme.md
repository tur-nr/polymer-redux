# Polymer Redux

Polymer bindings for Redux. Bind properties to a store's state and dispatch actions from within Polymer Elements.

## Intro
Polymer is a modern library for creating Web Components within an application. Redux is a state container for managing predictable data. Binding the two libraries together allows developers to create powerful and complex applications faster and simpler. This approach allows the components you build with Polymer to be more focused on functionality than an applications state.

## Installation
```
$ bower install --save tur-nr/polymer-redux
```

## Usage
### Boilerplate
Before importing Polymer Redux you must first include Redux to the applications document.
```
<!doctype>
<html>
    <head>
        <script src="./bower_components/webcomponentsjs/webcomponents.js"></script>
        <script src="./node_modules/redux/dist/redux.js"></script>
        <link rel="import" href="./bower_component/polymer-redux/polymer-redux.html">
    </head>
    <body>
        <!-- app -->
    </body>
</html>
```

### Setup
To bind Polymer components with Redux you must first create a ReduxBehavior which wraps your application's store and decorates your elements. Simply set up your Redux store as usual and then create the behavior with the `PolymerRedux` constructor passing the store.
```
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
Now `MyElement` has a connection to the Redux store and can bind properties to it's state and dispatch actions.

### Binding Properties
Polymer Redux binds state to the components properties. This binding happens on the `created` callback. To bind a property to a value in the state set the `statePath` key when defining properties in Polymer.
```
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
`<MyElement>.message` is now bound to the value of `message` in the state. Whenever the store state changes so to will the properties of the element.

#### Two-way Bindings
Principle #2 of Redux, [Three Principles](http://redux.js.org/docs/introduction/ThreePrinciples.html), says that state is read-only. Polymer however allows components to have two-way binding via the `notify` flag. If the properties flagged with `notify` and have `statePath` set, you will recieve a warning in your console.

### Dispatching Actions
