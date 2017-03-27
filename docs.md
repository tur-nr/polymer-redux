---
title: Documentation - Polymer Redux
permalink: docs
---

## [Documentation](#documentation) {#documentation}

Polymer bindings for Redux. Bind store state to properties and dispatch actions
from within Polymer Elements.

Polymer is a modern library for creating Web Components within an application.
Redux is a state container for managing predictable data. Binding the two
libraries together allows developers to create powerful and complex applications
faster and simpler. This approach allows the components you build with Polymer
to be more focused on functionality than the applications state.

<small><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> ***Warning***: This documentation presumes an application has been initialised with [`polymer-cli@next`](https://github.com/Polymer/polymer-cli).</small>  
<small><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> ***Warning***: This documentation won't go into specifics of how to use Redux, read the it's [documentation](http://redux.js.org).</small>

---

## [Install](#install) {#install}

```
bower install --save polymer-redux#polymer-2
```

*Polymer Redux also has an [NPM](https://www.npmjs.com/package/polymer-redux) package available.*

If the project hasn't already installed [Redux](http://redux.js.org), use NPM to install.

```
npm install --save redux
```

---

## [Usage](#usage) {#usage}

### [ReduxMixin](#reduxmixin) {#reduxmixin}

Polymer uses Class Mixins to extend and reuse functionality across Elements. Polymer Redux uses this techinque to bind any extending Element to a Redux store.

Create a new HTML file that will export a `ReduxMixin` for the consuming application.

```html
<!-- src/demo-app/redux-mixin.html -->

<link rel="../../bower_components/polymer-redux/polymer-redux.html">
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

`ReduxMixin` is just a [Class mixin function](http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/) that can be used to mix with `Polymer.Element` or any other Element within an application. A Class mixin function takes an internal Class definition, extends the given parent Class and returns a new Class.

```html
 <!-- src/demo-app/index.html -->

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

`statePath` informs Polymer Redux where in the state it find a property's value. There are two types of bindings in Polymer Redux, [Static Binding](#static-binding) and [Dynamic Binding](#dynamic-binding).

#### [Static Binding](#static-binding) {#static-binding}

Elements can bind their properties by giving a path to the value.

```html
<!-- src/demo-app/index.html -->

<link rel="import" href="../../bower_components/polymer/polymer.html">
<link rel="import" href="redux-mixin.html">
<script>
  // Use ReduxMixin to mix Polymer.Element into a new Class
  class DemoApp extends ReduxMixin(Polymer.Element) {
    static get is() { return 'demo-app'; }
    static get properties() {
      return {
        message: {
          type: String,
          statePath: 'message' // Binds state, "Hello, World!"
        }
      };
    }
  }
  customElement.define(DemoApp.is, DemoApp);
</script>
```

Now whenever the Redux reducer changes the value of `message` in the state, so to will the property.

<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: Paths can use dot notation for nested values. `user.name` and `user.friends.0.name` are legal paths.</small>  

#### [Dynamic Binding (Selectors)](#dynamic-binding) {#dynamic-binding}

Whilst [Static Binding](#static-binding) is easy it's not very flexible. When handling arrays or combining state from multiple paths it's best to use [Dynamic Binding](#dynamic-binding), or *selectors*.

Setting a `Function`, *selector*, as the `statePath` tells Polymer Redux that the binding is dynamic. It will pass the entire state to the selector and set the property to it's return value.

```js
class DemoApp extends ReduxMixin(Polymer.Element) {
  static get is() { return 'demo-app'; }
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

<small><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> ***Warning***: Functions are synchronous.</small>  
<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: To bind a property to the full state just return it `statePath(state) { return state; }`.</small>  
<small><i class="fa fa-info-circle" aria-hidden="true"></i> ***Info***: Check out [Reselect](https://github.com/reactjs/reselect) for a cleaner approach to create selectors.</small>

#### [Two-Way Binding](#two-way-binding) {#two-way-binding}

Principle #2 of Redux's [Three Principles](http://redux.js.org/docs/introduction/ThreePrinciples.html), says that state is read-only. Polymer however allows components to have two-way binding via the notify flag. If the properties flagged with `notify` and have `statePath` set, you will receive a warning in an application runtime.

### [Actions](#actions) {#actions}

State changes in Redux happen by what is known as [Actions](http://redux.js.org/docs/basics/Actions.html). Whenever a Redux application wishes to make a state change it dispatches an action to the reducer. The reducer makes these changes and the state is updated.

When writing a Polymer Redux application this pattern still applies. If a property value is binded, then setting that property's value is now redundant.

#### [Dispatching Actions](#dispatching-actions) {#dispatching-actions}

Any Element that extends [`ReduxMixin`](#reduxmixin) inherits a `.dispatch()` method. This method is used to dispatch actions to the Redux store.

*Update the `redux-mixin.html` reducer to handle an action.*

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
  static get is() { return 'demo-app'; }
  static get properties() {
    return {
      message: {
        type: String,
        statePath: 'message'
      }
    };
  }
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

An semantic and flexible way to dispatch actions to the store is to use Action Creators. Action Creators are defined statically on an Element, much like the way properties are. They return an object using the key for the action name and a `Function`, creator, as it's value.

WHY?
Share.
Dynamic.
Modular.


```js
class DemoApp extends ReduxMixin(Polymer.Element) {
  static get is() { return 'demo-app'; }
  static get properties() {
    return {
      message: {
        type: String,
        statePath: 'message'
      }
    };
  }
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
    this.dispatch('updateMessage', 'This is MAGIC!');
  }
}
```
