function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

ready(function () {
    var elementContainer = document.querySelector('nav.sidebar');
    var elementList = elementContainer.querySelector('ul');
    var elementButtonToggle = document.querySelector('body > .container > .sidebarToggle');
    var elementContent = document.querySelector('body > .container > main');
    var elementHeader = document.querySelector('body > header');
    var elementLinks = elementContainer.querySelectorAll('li > a');
    var elementInput = document.getElementById('filter-input');

    var sticky = false;
    var pathname = window.location.pathname;


    // highlight current active page in sidebar and scroll to it
    for (var i = 0; i < elementLinks.length; i++) {
        if (pathname.indexOf(elementLinks[i].getAttribute('href')) !== -1) {
            elementLinks[i].parentNode.classList.add('active');
            elementList.scroll(0, elementLinks[i].parentNode.offsetTop);
            break;
        }
    }


    // when page is scrolled, ensure nav bar sticks properly
    var onPageScroll = function () {
        // mobile
        if (window.innerWidth <= 480) {
            elementContainer.style.top = 0;
            return;
        }

        var scrollY = window.scrollY;
        var headerHeight = elementHeader.clientHeight;
        if (scrollY < headerHeight) {
            elementContainer.style.top = (headerHeight - scrollY) + 'px';
            sticky = false;
        } else if (!sticky) {
            elementContainer.style.top = 0;
            sticky = true;
        }
    };
    window.addEventListener('scroll', onPageScroll);
    window.addEventListener('resize', onPageScroll);
    onPageScroll();


    // toggle nav show/hide on mobile
    var onSidebarToggle = function (evt) {
        if (elementContainer.classList.contains('active')) {
            elementContainer.classList.remove('active');
            elementButtonToggle.classList.remove('active');
        } else {
            elementContainer.classList.add('active');
            elementButtonToggle.classList.add('active');
        }
        evt.preventDefault();
        evt.stopPropagation();
    };
    elementButtonToggle.addEventListener('mousedown', onSidebarToggle, false);
    elementButtonToggle.addEventListener('touchstart', onSidebarToggle, false);


    // when sidebar is not focused anymore, minimize it
    var onSidebarHide = function (evt) {
        if (elementContainer.classList.contains('active')) {
            elementContainer.classList.remove('active');
            elementButtonToggle.classList.remove('active');
            elementInput.blur();

            evt.preventDefault();
            evt.stopPropagation();
        }
    };
    elementContent.addEventListener('mousedown', onSidebarHide);
    elementContent.addEventListener('touchdown', onSidebarHide);
});
