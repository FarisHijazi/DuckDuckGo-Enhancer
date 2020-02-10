// ==UserScript==
// @name         DuckDuckGo Enhancer
// @namespace    https://github.com/buzamahmooza
// @author       Faris Hijazi
// @version      0.1
// @icon	     https://www.google.com/s2/favicons?domain=duckduckgo.com
// @match        https://duckduckgo.com*
// @include      https://duckduckgo.com*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        window.close
// @grant        window.focus
// @grant        unsafeWindow
// @run-at       document-idle
// @connect      *
// @require      https://code.jquery.com/jquery-3.2.1.slim.min.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\Scripts\Handy AF functions Faris.user.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\ShowImages.js\ShowImages.js
// @require      file:///C:\Users\faris\Dropbox\Apps\Tampermonkey\GM_downloader\GM_downloader.user.js
// ==/UserScript==


window.addEventListener('load', function onLoad() {

});


function navigateToJsPage() {
    location.assign(location.href.replace(/duckduckgo.com\//, 'duckduckgo.com/i.js'));
}

function ddgProxyET(url) {
    return '//external-content.duckduckgo.com/iu/?u=' + encodeURIComponent(url) + '&f=1';
}

unsafeWindow.ddgProxyET = ddgProxyET;
unsafeWindow.showFullresImages = showFullresImages;
unsafeWindow.ShowImages = ShowImages;

let shouldShowImages = false;
var showImages = new ShowImages();

new MutationObserver(function (mutations, observer) {
    const buttonsContainer = document.querySelector('#duckbar_static');
    const duckbar_dropdowns = document.querySelector('#duckbar_dropdowns');

    if (!buttonsContainer) return;
    
    buttonsContainer.appendChild(createElement('<li class="zcm__item"><a href=' + (location.href.replace(/duckduckgo.com\//, 'duckduckgo.com/i.js?')) + '>DDG js</a></li>'));

    showOriginalsButton = createElement('<li class="zcm__item"><a class="zcm__link  js-zci-link  js-zci-link--maps_expanded" href="JavaScript:void(0);">Show Originals</a></li>');
    showOriginalsButton.addEventListener('click', function (e) {
        shouldShowImages = true;
        showFullresImages();
    });

    duckbar_dropdowns.appendChild(showOriginalsButton);

    observer.disconnect();
}).observe(document.body, {
    childList: true, subtree: true,
    attributes: false, characterData: false
});


observeDocument(handleImgBoxes);

function getImgFromItem(item) {
    const thumbnailUrl = ddgProxyET(item.thumbnail);
    var img = document.querySelector([
        // 'img[thumbnail="' + $.escapeSelector(thumbnailUrl) + '"]',
        // 'img[src="' + $.escapeSelector(thumbnailUrl) + '"]',
        'img[data-src="' + $.escapeSelector(thumbnailUrl) + '"]'
    ].join());
    if (img) img.item = item;
    return img;
}
function getItemFromImg(img) {
    const thumbnailUrl = new URL(img.getAttribute('thumbnail')).searchParams.get('u');
    for (const item of DDG.duckbar.tabs.images.view.model.items) {
        if (item.thumbnail === thumbnailUrl) {
            img.item = item;
            return item;
        }
    }
}

function showFullresImages() {
    for (const item of DDG.duckbar.tabs.images.view.model.items) {
        const img = getImgFromItem(item);
        const anchor = img.closest('a.img-link');
        if (!img || !anchor) {
            console.log('getImgFromItem(): img not found');
            continue;
        }
        anchor.setAttribute('href', item.image);
    }
    showImages.displayImages();
}

function handleImgBoxes(mutations) {
    if (shouldShowImages) {
        showFullresImages();
    }

    var imgBoxes = document.querySelectorAll('div.tile.tile--img');

    for (const imgBox of imgBoxes) {
        if (imgBox.classList.contains('img-link')) {
            continue;
        }
        imgBox.classList.add('img-link');

        const container = imgBox.querySelector('div.tile--img__media');
        const span = container.querySelector('span.tile--img__media__i');
        const img = span.querySelector('img');

        const anchor = $(`<a class="img-link" href="${img.src}" style="display: block;">`)[0];

        img.setAttribute('thumbnail', img.src);

        container.appendChild(anchor);
        anchor.appendChild(span);
    }
}

(function () {
    'use strict';
    // Your code here...
})();


function observeDocument(callback) {
    callback(document.body);
    
    const observe = (observer)=>observer.observe(document.body, {
        childList: true, subtree: true,
        attributes: false, characterData: false
    });

    const observer = new MutationObserver(function (mutations) {
        if (mutations.length) {
            observer.disconnect()
            callback(mutations, observer);

            observe(observer);
        }
    });

    observe(observer);
}