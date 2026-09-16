function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

ready(function () {
    var elementSearch = document.getElementById('search');

    elementSearch.addEventListener('keydown', function (e) {
        if (e.which === 13 || e.keyCode === 13) {
            window.location.href = "/search/?q=" + elementSearch.value;
        }
    });
});
