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


console.log('DuckDuckGo-enhancer');

unsafeWindow.ddgProxyET = ddgProxyET;
unsafeWindow.showFullresImages = showFullresImages;
unsafeWindow.ShowImages = ShowImages;
let shouldShowImages = false;

const showImages = new ShowImages();

const Preferences = (function () {
    const DEFAULTS = {
        // these should be under "page"
        page: {
            defaultAnchorTarget: '_blank',
            staticNavbar: false,
            autoLoadMoreImages: false, // somewhat problematic and can be annoying
            showImgHoverPeriod: 350, // if negative, then hovering functionality is disabled
            disableDragging: true, //disable dragging images to reverse image search
        },
        shortcuts: {
            hotkey: 'ctrlKey', // 'altKey', 'shiftKey'
        },
        loading: {
            successColor: 'rgb(167, 99, 255)',
            hideFailedImagesOnLoad: false,
        },
        panels: {
            autoShowFullresRelatedImages: true,
            loopbackWhenCyclingRelatedImages: false,
            favoriteOnDownloads: true, // favorite any image that you download
            enableWheelNavigation: true,
            invertWheelRelativeImageNavigation: false,
        },
    };

    const o = Object.assign(DEFAULTS, GM_getValue('Preferences'));

    o.store = () => GM_setValue('Preferences', o);
    o.get = () => GM_getValue('Preferences');

    // write back to storage (in case the storage was empty)
    o.store();

    return o;
})();

/**
 * Adds a mouseover listener to showOriginal if you hover over an image for a moment
 */
const addHoverListener = (function () {
    let pageX = 0;
    let pageY = 0;

    return function (imgBx) {
        let timeout = null;
        const checkAndResetTimer = e => {
            if (!(pageX === e.pageX && pageY === e.pageY)) {
                // console.log(`mouse has moved, is: (${e.clientX}, ${e.clientY}) was: (${pageX}, ${pageY})`);
                clearTimeout(timeout);
            }
        };

        const img = imgBx.querySelector('img');

        function replaceImg() {
            showImages.replaceImgSrc(img, img.closest('a'));
        }

        const onMouseUpdate = (e) => {
            if (e[Preferences.shortcuts.hotkey]) {
                replaceImg();
            }

            checkAndResetTimer(e);
            imgBx.mouseX = e.clientX;
            imgBx.mouseY = e.clientY;
            if (!(Preferences.page.showImgHoverPeriod < 0)) // if not negative
                timeout = setTimeout(function () {
                    checkAndResetTimer(e);
                    replaceImg();
                }, Preferences.page.showImgHoverPeriod);
        };

        img.addEventListener('hotkey', replaceImg, false);
        imgBx.addEventListener('hotkey', replaceImg, false);

        imgBx.addEventListener('mousemove', onMouseUpdate, false);
        imgBx.addEventListener('mouseenter', onMouseUpdate, false);
        imgBx.addEventListener('mouseout', () => clearTimeout(timeout));
    };
})();


(function () {
    'use strict';

    elementReady('#duckbar_static').then(buttonsContainer => {
        buttonsContainer.appendChild($('<li class="zcm__item"><a href=' + (location.href.replace(/duckduckgo\.com\//, 'duckduckgo.com/i.js?')) + '>DDG js</a></li>')[0]);

        //TODO: convert this button to a checkbox and it remembers across sessions (use GM_setValue)
        const $showOriginalsButton = $('<li class="zcm__item"><a class="zcm__link  js-zci-link  js-zci-link--maps_expanded" href="JavaScript:void(0);">Show Originals</a></li>')
            .on('click', function (e) {
                shouldShowImages = true;
                showFullresImages();
            }).attr('id', 'showOriginalsButton')[0];

        const $downloadAllButton = $('<li class="zcm__item"><a class="zcm__link  js-zci-link  js-zci-link--maps_expanded" href="JavaScript:void(0);">Download all</a></li>')
            .on('click', function (e) {
                zipFiles(document.querySelectorAll('div.tile.tile--img.img-link img'));
            }).attr('id', 'downloadAllButton')[0];

        // append them to the dropdowns bar
        $('div.metabar__dropdowns-wrap > div')
            .append($showOriginalsButton)
            .append($downloadAllButton)
    });

    observeDocument(handleImgBoxes);

})();

function createCheckbox(id, labelText = 'label', onChange = () => null, checked = false) {
    checked = GM_getValue(id, checked); // load value, fallback to passed value

    const $container = $('<div>').attr({
        'id': id.trim() + '-div',
        'class': 'sg',
    }).css({
        'display': 'inline',
    });
    const $checkbox = $('<input>').attr({
        'id': id,
        'type': 'checkbox',
        'checked': checked,
    });
    const $label = $(`<label for="${id}">${labelText.replace(/\s/g, '&nbsp;')}</label>`);

    $container.append($label)
        .append($checkbox)
        .change(function (e) {
            if (typeof onChange === 'function')
                onChange.call($checkbox[0], e);

            GM_setValue(id, $checkbox[0].checked);
        });

    return $container[0];
}

function navigateToJsPage() {
    location.assign(location.href.replace(/duckduckgo\.com\//, 'duckduckgo.com/i.js'));
}

function ddgProxyET(url) {
    return '//external-content.duckduckgo.com/iu/?u=' + encodeURIComponent(url) + '&f=1';
}

function getImgFromItem(item) {
    const thumbnailUrl = ddgProxyET(item.thumbnail);
    const img = document.querySelector([
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
        const anchor = img && img.closest('a.img-link');
        if (!img || !anchor) {
            console.log('getImgFromItem(): img not found');
            continue;
        }
        anchor.setAttribute('href', item.image);
    }
    showImages.displayImages();
}

/**
 *
 * @param mutations
 */
function handleImgBoxes(mutations) {
    // get all images that don't have .img-link (we'll add those later to prevent duplications)
    const imgBoxes = document.querySelectorAll('div.tile.tile--img:not(.img-link)');
    for (const imgBox of imgBoxes) {
        imgBox.classList.add('img-link'); // add class "img-link", this way we won't do this next time (should be only once)

        const container = imgBox.querySelector('div.tile--img__media');
        const span = container.querySelector('span.tile--img__media__i');

        const img = span.querySelector('img');
        img.setAttribute('thumbnail', img.src);

        const anchor = $(`<a class="img-link" href="${img.src}" style="display: block;">`)[0];

        container.appendChild(anchor);
        anchor.appendChild(span);

        addHoverListener(imgBox);
    }


    if (shouldShowImages) {
        showFullresImages();
    }
}


function observeDocument(callback) {
    callback(document.body);

    const observe = (observer) => observer.observe(document.body, {
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

function elementReady(selector, timeoutInMs = -1) {
    return new Promise((resolve, reject) => {
        const getter = typeof selector === 'function' ?
            () => selector() :
            () => document.querySelectorAll(selector)
        ;
        const els = getter();
        if (els && els.length) {
            resolve(els[0]);
        }
        if (timeoutInMs > 0) {
            var timeout = setTimeout(() => {
                reject(`elementReady(${selector}) timed out at ${timeoutInMs}ms`);
                console.debug(`elementReady(${selector}) timed out at ${timeoutInMs}ms`);
            }, timeoutInMs);
        }


        new MutationObserver((mutationRecords, observer) => {
            Array.from(getter() || []).forEach((element) => {
                clearTimeout(timeout);
                resolve(element);
                observer.disconnect();
            });
        }).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    });
}
