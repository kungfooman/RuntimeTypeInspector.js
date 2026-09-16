function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

ready(function () {
    var filter = '';
    var filterHistory = '';

    var elementInput = document.getElementById('filter-input');
    var elementInputClear = document.querySelector('nav.sidebar > .sidebarFilter > .clear');
    var elementItems = document.querySelectorAll('nav.sidebar > ul > li');


    // update browser history when filter is changed
    var updateHistoryState = function () {
        var query = { };

        if (filterHistory === filter) return;
        if (filter) query.filter = filter;

        filterHistory = filter;

        var search = (new URLSearchParams(query)).toString();
        var url = window.location.origin + window.location.pathname;

        if (search) url += '?' + search;

        window.history.replaceState({
            filter: filter
        }, document.title, url);
    };


    // hide/show elements based on filter
    var filterElements = function (value, force) {
        if (filter === value && !force)
            return;

        filter = value;

        for (var i = 0; i < elementItems.length; i++) {
            if (filter && elementItems[i].id.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                elementItems[i].classList.add('hidden');
            } else {
                elementItems[i].classList.remove('hidden');
            }
        }

        if (filter) {
            elementInputClear.classList.add('active');
        } else {
            elementInputClear.classList.remove('active');
        }
    };


    var onClearFilter = function () {
        if (!filter) return;
        elementInput.value = '';
        filterElements('');
        updateHistoryState();
    };

    elementInputClear.addEventListener('mousedown', onClearFilter);
    elementInputClear.addEventListener('touchdown', onClearFilter);


    // attach events for triggering filter
    elementInput.addEventListener('keydown', function () {
        filterElements(elementInput.value);
    });
    elementInput.addEventListener('keyup', function () {
        filterElements(elementInput.value);
    });
    elementInput.addEventListener('change', function () {
        filterElements(elementInput.value);
        updateHistoryState();
    });


    // when page loaded, ensure it is respecting URL query for initial filter
    if (window.URLSearchParams) {
        var query = new URLSearchParams(window.location.search);
        var value = query.get('filter') || '';

        if (filter !== value) {
            filterHistory = value;
            elementInput.value = value;
            filterElements(value);
        }
    }
});
