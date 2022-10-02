const logResult = result => {
    if (chrome.extension.lastError) {
        return console.error(chrome.extension.lastError);
    }

    return console.log(result);
};


const downloadElement = clickContext => {
    if (clickContext.menuItemId !== 'saveit') {
        return;
    }

    const url = clickContext.srcUrl || clickContext.linkUrl || clickContext.pageUrl;

    if (!url) {
        return;
    }

    const filename = undefined;

    const downloadOptions = {
        url,
        //filename,
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
