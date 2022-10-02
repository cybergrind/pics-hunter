const logResult = result => {
    if (chrome.extension.lastError) {
        return console.error(chrome.extension.lastError);
    }

    return console.log(result);
};

const yaGetImage = async () => {
    const getMetaInner = (url) => new Promise((resolve, reject) => {
        console.log(`Get image for: ${url}`);
        const img = new Image();

        img.onload = async () => resolve({
            height: img.height,
            width: img.width,
            url,
        });
        img.src = url;
    });


    const yaGetBestResolution = async () => {
        const box = document.querySelector('.MMViewerButtons-OpenImageSizes');
        const switcher = box.children[1];
        console.log('Switcher: ', switcher);
        if (!switcher) {
            return box.children[0].href;
        }
        switcher.click();
        const best = document.querySelector('.MMViewerButtons-ImageSizesList').children[0].children[0];
        return best.href;
    };

    const wrapWithTimeout = async (f, args = [], timeout = 3000) => {
        const resp = await Promise.race([
            f(...args),
            new Promise((resolve, reject) => {
                setTimeout(() => resolve(undefined), timeout);
            }),
        ]);
        return resp;
    };

    const getMeta = async (url) => {
        const resp = await wrapWithTimeout(getMetaInner, [url], 3000);
        return resp;
    };

    const bestUrl = await yaGetBestResolution();
    const imgUrl = document.querySelector('.MMImage-Origin').src;
    const previewUrl = document.querySelector('.MMImage-Preview').src;
    let toFilter;
    if (bestUrl === imgUrl) {
        toFilter = await Promise.all([
            getMeta(bestUrl),
            getMeta(previewUrl),
        ]);
    } else {
        toFilter = await Promise.all([
            getMeta(bestUrl),
            getMeta(imgUrl),
            getMeta(previewUrl),
        ]);
    }
    console.log('All images');
    console.log(toFilter);
    const bestImage = toFilter.filter(Boolean).sort((a, b) => b.width * b.height - a.width * a.height)[0];
    console.log('Best is');
    console.log(bestImage);
    return bestImage;
};


const getTabId = async () => {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    return tabs[0].id;
};


const getYaImageUrl = async url => {
    const tabId = await getTabId();
    const out = await chrome.scripting.executeScript({
        target: {tabId},
        func: yaGetImage,
    });
    const resp = out[0].result;
    console.log('Got resp:');
    console.log(resp);
    return resp.url;
};

const downloadElement = async clickContext => {
    if (clickContext.menuItemId !== 'saveit') {
        return;
    }
    const url = clickContext.srcUrl || clickContext.linkUrl || clickContext.pageUrl;
    console.log(clickContext);

    if (!url) {
        return;
    }

    const page = clickContext.pageUrl;
    let imageUrl;

    if (/^https:\/\/yandex\..*\/images\/search/.test(page)) {
        console.log('Get YA Image');
        imageUrl = await getYaImageUrl(url);
        if (!imageUrl) {
            return;
        }
    } else {
        console.log(`Just URL: ${page}`);
        imageUrl = url;
    }

    const downloadOptions = {
        url: imageUrl,
        conflictAction: 'prompt',
        saveAs: false,
    };

    chrome.downloads.download(downloadOptions, logResult);
};

const createMenuItems = () => {
  // avoids duplicates on upgrade by removing existing menu items first
    chrome.contextMenus.removeAll(result => {
        logResult(result);

        const menuProperties = {
            id: 'saveit',
            title: 'Pic Save',
            contexts: ['all'],
            // onclick: downloadElement,
        };

        chrome.contextMenus.create(
          menuProperties,
          logResult
        );
    });
};

chrome.runtime.onInstalled.addListener(createMenuItems);
chrome.contextMenus.onClicked.addListener(downloadElement);
