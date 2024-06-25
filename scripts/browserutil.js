const BrowserUtil = {

    instance: undefined,
    /**
     * Fetches appropriate browser api
     */
    setBrowser() {
        if (this.instance === undefined) {
            if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') {
                this.instance = chrome;
            } else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
                this.instance = browser;
            } else {
                throw new LeetHubError('BrowserNotSupported');
            }
        }
    }
}

BrowserUtil.setBrowser();
