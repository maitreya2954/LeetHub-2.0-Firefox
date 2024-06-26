const BrowserUtil = {

    instance: undefined,

    isChrome: false,

    /**
     * Fetches appropriate browser api
     */
    init() {
        if (this.instance === undefined) {
            if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') {
                this.instance = chrome;
            } else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
                this.instance = browser;
            } else {
                throw new LeetHubError('BrowserNotSupported');
            }
        }
        this.isChrome = window.navigation !== undefined;
    }
}

BrowserUtil.init();
