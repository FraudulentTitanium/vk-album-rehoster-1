function listenerHandler(authenticationTabId, imageSourceUrl) {

    return function tabUpdateListener(tabId, changeInfo) {
        var vkAccessToken,
            vkAccessTokenExpiredFlag;

        if (tabId === authenticationTabId && changeInfo.url !== undefined && changeInfo.status === "loading") {

            if (changeInfo.url.indexOf('oauth.vk.com/blank.html') > -1) {
                authenticationTabId = null;
                chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                vkAccessToken = getUrlParameterValue(changeInfo.url, 'access_token');

                if (vkAccessToken === undefined || vkAccessToken.length === undefined) {
                    displayeAnError('vk auth response problem', 'access_token length = 0 or vkAccessToken == undefined');
                    return;
                }

                vkAccessTokenExpiredFlag = Number(getUrlParameterValue(changeInfo.url, 'expires_in'));

                if (vkAccessTokenExpiredFlag !== 0) {
                    displayeAnError('vk auth response problem', 'vkAccessTokenExpiredFlag != 0' + vkAccessToken);
                    return;
                }

                chrome.storage.local.set({'vkaccess_token': vkAccessToken}, function () {
                    chrome.tabs.update(
                        tabId,
                        {
                            'url'   : 'upload.html#' + imageSourceUrl + '&' + vkAccessToken,
                            'active': true
                        },
                        function (tab) {}
                    );
                });
            }
        }
    };
}

function getClickHandler() {

    return function (info, tab) {

        var imageSourceUrl       = info.srcUrl,
            imageUploadHelperUrl = 'upload.html#',
//            vkCLientId           = '3315996', TODO register app
            vkRequestedScopes    = 'photos,offline',
            vkAuthenticationUrl  = 'https://oauth.vk.com/authorize?client_id=' + vkCLientId + '&scope=' + vkRequestedScopes + '&redirect_uri=http%3A%2F%2Foauth.vk.com%2Fblank.html&display=page&response_type=token';

        chrome.storage.local.get({'vkaccess_token': {}}, function (items) {

            if (items.vkaccess_token.length === undefined) {
                chrome.tabs.create({url: vkAuthenticationUrl, selected: true}, function (tab) {
                    chrome.tabs.onUpdated.addListener(listenerHandler(tab.id, imageSourceUrl));
                });

                return;
            }

            imageUploadHelperUrl += imageSourceUrl + '&' + items.vkaccess_token + '&' + vkCLientId;

            chrome.tabs.create({url: imageUploadHelperUrl, selected: true});

        });
    };
}

chrome.contextMenus.create(
{
  "title": "Post to album vk.com",
  "type": "normal",
  "contexts": ["image"],
  "onclick": getClickHandler()
});