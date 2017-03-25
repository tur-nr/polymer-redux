(function($$) {
    // Polyfill $$
    if (typeof $$ !== 'function') {
        $$ = function(query, target) {
            target = target || document;
            return target.querySelectorAll(query);
        };
    }

    // Cast to array
    function arrify(arr) {
        return [].slice.call(arr);
    }

    // Finding nodes
    function find(selector, target) {
        return arrify($$(selector, target));
    }

    // Reduce active element
    function reduceActive(a, b) {
        if (a.classList.contains('active')) {
            return a;
        } else if (b.classList.contains('active')) {
            return b;
        }
    }

    // Page ready
    window.addEventListener('DOMContentLoaded', function () {
        // Build tabs
        find('.tabs').forEach(function(tab) {
            var items = find('ul > li', tab);
            var containers = find('.content > div', tab);
            var active = items.reduce(reduceActive);

            // Click handlers
            items.forEach(function (i) {
                i.addEventListener('click', function () {
                    if (i === active) return;

                    var name = i.dataset.tab;
                    i.classList.add('active');
                    active.classList.remove('active');
                    active = i;

                    // Select container
                    containers.forEach(function (c) {
                        if (c.dataset.tab === name) {
                            c.classList.add('active');
                        } else {
                            c.classList.remove('active');
                        }
                    });
                });
            })
        });

        // Home demo input
        var homeInput = document.getElementById('demo-home-input');
        homeInput.addEventListener('keyup', function (e) {
            if (e.keyCode === 13) {
                store.dispatch({type: 'UPDATE_MESSAGE', message: e.target.value});
                e.target.value = null;
                e.target.focus();
            }
        });
    });
})(this.$$);
