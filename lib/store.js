(function(Redux) {
  Redux.StoreElement = Polymer({
    is: 'redux-store',
    listeners: {
      'redux-reducer-ready': '_handleReducer'
    },
    created: function() {
      this._reducers = {};
      this._reducer = null;
      this._store = null;
    },
    _handleReducer: function(event) {
      var reducer = event.target;
      var that = this;

      if ('function' !== typeof reducer.reduce) {
        throw new TypeError('no reduce method');
      }

      if (this._reducer && !length) {
        // default reducer in place
        throw new TypeError('reducer already set');
      }

      if (reducer.stateKey) {
        // combined
        this._reducers[reducer.stateKey] = reducer;
        this._reducer = Redux.combineReducers(this._reducers);
      } else {
        // default
        this._reducer = reducer.reduce;
      }

      // laxy load store
      if (!this._store) {
        this._store = Redux.createStore(function(state, action) {
          return that._reducer(state, action);
        });

        this._store.subscribe(function() {
          that.fire('redux-store-state', that._store.getState());
        });
      }
    }
  });
})(this.Redux);
