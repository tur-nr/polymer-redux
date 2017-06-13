---
title: Documentation - Polymer Redux
permalink: docs
---

## [Documentation](#documentation) {#documentation}

[Polymer](https://www.polymer-project.org) bindings for [Redux](http://redux.js.org).
Bind store state to properties and dispatch actions from within Polymer Elements.

Polymer is a modern library for creating [Web Components](https://github.com/w3c/webcomponents) within an application. Redux is a state container for managing predictable data. Joining the two libraries together allows developers to create powerful and complex applications faster and simpler. This approach allows the components you build with Polymer to be more focused on functionality than the applications state.

<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: This documentation presumes an application has been initialised with [`polymer-cli@next`](https://github.com/Polymer/polymer-cli).</small>  
<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: This documentation won't go into specifics of how to use Redux, read the it's [documentation](http://redux.js.org).</small>

---

## [Install](#install) {#install}

```
bower install --save polymer-redux
```

<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: `polymer-redux` [NPM](https://www.npmjs.com/package/polymer-redux) package available.</small>

If the project hasn't already installed [Redux](http://redux.js.org), use NPM to install.

```
npm install --save redux
```

---

## [Usage](#usage) {#usage}

### [ReduxMixin](#reduxmixin) {#reduxmixin}

Polymer uses [Class Mixins](http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes) to extend and reuse functionality across Elements. Polymer Redux uses this techinque to connect any extending Element to a Redux store.

```html
<!-- src/demo-app/redux-mixin.html -->

<link rel="import" href="../../bower_components/polymer-redux/polymer-redux.html">
<script src="../../node_modules/redux/dist/redux.js"></script>
<script>
  // Setup a Redux store
  const initial = {message: 'Hello, World!'};
  const reducer = state => state;
  const store = Redux.createStore(reducer, initial);

  // Export the ReduxMixin
  ReduxMixin = PolymerRedux(store);
</script>
```

How the Redux store is setup and initialised has no relation to Polymer Redux. Applying [middleware](http://redux.js.org/docs/advanced/Middleware.html), [selectors](https://github.com/reactjs/reselect) and setting up the store elsewhere is up to the developer.

#### [Creating Elements](#creating-elements) {#creating-elements}

`ReduxMixin` is just a Class Mixin that can be used to mix with `Polymer.Element` or any other Element within an application. A Class Mixin function takes an internal Class definition, extends the given parent Class and returns a new Class.

```html
 <!-- src/demo-app/demo-app.html -->

<link rel="import" href="../../bower_components/polymer/polymer.html">
<link rel="import" href="redux-mixin.html">
<script>
  // Use ReduxMixin to mix Polymer.Element into a new Class
  class DemoApp extends ReduxMixin(Polymer.Element) {
    static get is() { return 'demo-app'; }
  }
  customElement.define(DemoApp.is, DemoApp);
</script>
```

`DemoApp` now extends both `Polymer.Element` and the underlying Polymer Redux Class.

### [Binding Properties](#binding-properties) {#binding-properties}

Polymer Redux binds state to an Element's property. It adds a new key for defining properties, `statePath`.

`statePath` informs Polymer Redux where in the state it can find a property's value. There are two types of bindings in Polymer Redux, [Static Binding](#static-binding) and [Dynamic Binding](#dynamic-binding).

#### [Static Binding](#static-binding) {#static-binding}

Elements can bind their properties by giving a path to the value.

```js
class DemoApp extends ReduxMixin(Polymer.Element) {
  // ...

  static get properties() {
    return {
      message: {
        type: String,
        statePath: 'message' // Binds state, "Hello, World!"
      }
    };
  }
}
```

Now whenever the Redux store changes the value of `message` in the state, so to will the property.

<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: Paths can use dot notation for nested values. `user.name` and `user.friends.0.name` are legal paths.</small>  

#### [Dynamic Binding (Selectors)](#dynamic-binding) {#dynamic-binding}

Whilst [Static Binding](#static-binding) is easy it's not very flexible. When handling arrays or combining state from multiple paths it's best to use Dynamic Binding, or *selectors*.

Setting a `Function`, *selector*, as the `statePath` tells Polymer Redux that the binding is dynamic. It will pass the store's state to the selector and set the property to it's return value.

```js
class DemoApp extends ReduxMixin(Polymer.Element) {
  // ...

  static get properties() {
    return {
      message: {
        type: String,
        statePath(state) {
          return 'Message from Redux: ' + state.message;
        }
      }
    };
  }
}
```

<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: Selectors are [*pure*](https://medium.com/javascript-scene/master-the-javascript-interview-what-is-a-pure-function-d1c076bec976#.3dg24hk2m) functions.</small>  
<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: To bind a property to the full state just return it `statePath(state) { return state; }`.</small>  
<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: Check out [Reselect](https://github.com/reactjs/reselect) for a cleaner approach to create selectors.</small>

#### [Inherited Properties](#inherited-properties) {#inherited-properties}

It is also possible to share properties across multiple Elements using Class Mixins.

```html
<!-- src/demo-app/message-mixin.html -->

<link rel="import" rel="redux-mixin.html">
<script>
  MessageMixin = Parent => class MessageMixin extends ReduxMixin(Parent) {
    static get properties() {
      return {
        message: {
          type: String,
          statePath: 'message'
        }
      }
    }
  }
</script>
```

<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: Property bindings respect the prototypal inheritance model.</small>  
<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: An Element's property bindings are *final*.</small>  


#### [Two-Way Binding](#two-way-binding) {#two-way-binding}

Principle #2 of Redux's [Three Principles](http://redux.js.org/docs/introduction/ThreePrinciples.html) says that state is read-only. Polymer however allows components to have two-way binding via the notify flag. If the properties flagged with `notify` and has `statePath` set, a warning be logged during the application runtime.

### [Actions](#actions) {#actions}

State changes in Redux happen by what is known as [Actions](http://redux.js.org/docs/basics/Actions.html). Whenever a Redux application wishes to make a state change it dispatches an action to the reducer. The reducer makes these changes and the state is updated.

When writing a Polymer Redux application this pattern still applies. If a property value is binded, then setting that property's value is now redundant.

#### [Dispatching Actions](#dispatching-actions) {#dispatching-actions}

Any Element that extends [`ReduxMixin`](#reduxmixin) inherits a `.dispatch()` method. This method is used to dispatch actions to the Redux store.

```js
const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_MESSAGE':
      // ALWAYS return new state
      return Object.assign({}, state, {
        message: action.message // New message
      });
    
    // Return the state, nothing changed.
    default:
      return state;
  }
};
```

Now whenever the action of type `UPDATE_MESSAGE` is triggered, the reducer will update the state and all binded properties will recieve the new state values.

```js
class DemoApp extends ReduxMixin(Polymer.Element) {
  // ...

  connectedCallback() {
    super.connectedCallback();

    // Let's update the message
    this.dispatch({
      type: 'UPDATE_MESSAGE',
      message: 'This is MAGIC!',
    });
  }
}
```

#### [Action Creators](#action-creators) {#action-creators}

A cleaner and flexible way to dispatch actions to the store is to use Action Creators. Action Creators are defined statically on an Element, much like the way properties are. They return an object using the key for the action name and a `Function` as it's value for the creator.

```js
class DemoApp extends ReduxMixin(Polymer.Element) {
  // ...

  static get actions() {
    return {
      updateMessage(message) {
        return {
          type: 'UPDATE_MESSAGE',
          message
        };
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();

    // Update message using the Action Creator
    this.dispatch('updateMessage', 'This is also MAGIC!');
  }
}
```

Using Action Creators is highly recommended when using Polymer Redux. It provides a number of advantages;

*Scope*

Creators defined on an Element are scoped to that Element. So developers can identify what actions it will dispatch.

*Sharing*

Using Class Mixins actions can be shared across multiple Elements. This is good practice as actions can be grouped together based on topics of the applications state. See [Inherited Actions](#inherited-actions).

*Modular*

The actual creator can be imported from an external resource allowing them to be modular, decoupled and pure functions. Making the them easier to test.

#### [Inherited Actions](#inherited-actions) {#inherited-actions}

Like [Inherited Properties](#inherited-properties) it is also possible to inherit actions from other Class Mixins.

```html
<!-- src/demo-app/actions-mixin.html -->

<link rel="import" rel="redux-mixin.html">
<script>
  ActionsMixin = Parent => class ActionsMixin extends ReduxMixin(Parent) {
    static get actions() {
      return {
        sharedAction() {
          return {
            type: 'SHARED_ACTION'
          }
        }
      }
    }
  }
</script>
```

<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: Actions respect the prototypal inheritance model.</small>  
<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: An Element's actions are *final*.</small>

#### [Asynchronous Actions](#async-actions) {#async-actions}

[Redux Thunk](https://github.com/gaearon/redux-thunk) middleware gives the Redux store the ability to dispatch actions that are asynchronous. Like fetching data from an API service, or waiting for a response from a `WebWorker`.

The `.dispatch()` method on an Polymer Redux Element can also be used in the same way as using Redux Thunk.

```js
class DemoApp extends ReduxMixin(Polymer.Element) {
  // ...

  connectedCallback() {
    super.connectedCallback();

    // Update message using Redux Thunk
    this.dispatch((dispatch) => {
      dispatch('updateMessage', 'Please wait...');

      // Do async task
      setTimeout(() => {
        dispatch('updateMessage', 'Sorry for being late!');
      }, 1000);
    });
  }
}
```
