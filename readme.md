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
    	<link rel="import" href="./bower_components/polymer/polymer.html">
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
initialState = {customer: {age: 30, name: 'Polymer Redux'}}
store = Redux.createStore(appReducer)
var ReduxBehavior = PolymerRedux(store)

function appReducer(state, action) {
    state = state || initialState
    var customer =
    {
        name: nameReducer(state.customer.name, action),
        age: ageReducer(state.customer.age, action)
    }
    return {customer: customer}
}

function nameReducer(state, action) {
    switch (action.type) {
        case 'update':
            return action.value || state
        default:
            return state;
    }
}

function ageReducer(state, action) {
    switch(action.type) {
        case 'increase':
            return state + 1
        case 'decrease':
            return state - 1
        default:
            return state
    }
}
```


### Binding Properties

Polymer Redux binds state to the components properties. This binding happens on
the `created` callback. To bind a property to a value in the state set the
`statePath` key when defining properties in Polymer.

```javascript
Polymer({
    is: 'show-simplecustomer',
    behaviors: [ ReduxBehavior ],
    properties: {
        message: {
            type: Object,
            statePath: 'customer'
        }
    }
});
```


#### Dot Notation

Binding properties this way makes use of [`Polymer.Base.get()`](http://polymer.github.io/polymer/) method, so you can use dot notation paths like so: `'customer.name'`.


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

#### Two-way Bindings

Principle #2 of Redux's [Three Principles](http://redux.js.org/docs/introduction/ThreePrinciples.html),
says that state is read-only. Polymer however allows components to have two-way
binding via the `notify` flag. If the properties flagged with `notify` and have
`statePath` set, you will recieve a warning in your application runtime.

### Dispatching Actions

For an easier and semanatic way to dispatch actions against the store, is to create a list of actions the component can trigger. Adding a list of functions to the `actions` property, exposes them to the `dispatch()` method of the element. Or you can just simply `dispatch` an action object with `type` name.

Add 2 buttons to increase/decrease the `customer.age`, and add one input field and button to update `customer.name`.

```html
<dom-module id="show-customer">
    <template>
        <h1>Hello, <span>[[customer.name]]</span></h1>
        <h2>Age: <span>[[customer.age]]</span></h2>
        <div>
            <button id="increaseButton">+</button>
            <button id="decreaseButton">-</button>
        </div>
        <br/>
        <input id="nameTextField" placeHolder="new name"></input>
        <button id="updateButton">update</button>
    </template>
</dom-module>
```

Add event handlers for buttons and input field.

```javascript
Polymer({
    is: 'show-customer',
    behaviors: [ ReduxBehavior ],
    properties: {
        customer: {
            type: Object,
            statePath: 'customer'
        }
    },
    listeners: {
        'increaseButton.click': '_handleIncrease',
        'decreaseButton.click': '_handleDecrease',
        'updateButton.click': '_handleUpdate',
        'nameTextField.keypress': '_handleKeypress'
    },
    _handleIncrease: function() {
        this.dispatch({type: 'increase'})
    },
    _handleDecrease: function() {
        this.dispatch({type: 'decrease'})
    },
    _handleUpdate: function() {
        this.dispatch({type: 'update', value: this.$.nameTextField.value})
        this.$.nameTextField.value = ''
    },
    _handleKeypress: function(e) {
        if(e.which === 13 && !!e.currentTarget.value.trim()) {
            this._handleUpdate();
        }
    }
});
```

`dispatch()` also takes a function that returns a action object.

```javascript
Polymer({
//...
    handleClick: function() {
        this.dispatch(function() {
            return {
               type: 'ACTION'
            };
        });
    }
});
```

### Make it Work
Just simply declare the custom `Polymer` element as below.

```html
<show-customer></show-customer>
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

Copyright (c) 2016 [Christopher Turner](https://github.com/tur-nr)
