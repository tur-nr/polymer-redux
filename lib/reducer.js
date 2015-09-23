(function(Redux) {
  Redux.ReducerBehavior = {
    ready: function() {
      var key = this.getAttribute('state-key');
      if (key) {
        this._setStateKey(key);
      }
      this.fire('redux-reducer-ready');
    },
    properties: {
      stateKey: {
        type: String,
        readOnly: true,
        reflectToAttribute: true
      }
    },
    reduce: function(state, action) {
      throw new SyntaxError('reducer implementation missing');
    }
  };
})(this.Redux);
