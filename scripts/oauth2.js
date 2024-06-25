// eslint-disable-next-line no-unused-vars
const oAuth2 = {
  /**
   * Initialize
   */
  init() {
    this.KEY = 'leethub_token';
    this.ACCESS_TOKEN_URL =
      'https://github.com/login/oauth/access_token';
    this.AUTHORIZATION_URL =
      'https://github.com/login/oauth/authorize';
    this.CLIENT_ID = 'Ov23liMeWjRNjUo5vymQ';
    this.CLIENT_SECRET = '48be4eedd455041e092cba5e059c8f65fd27f0d3';
    this.REDIRECT_URL = 'https://github.com/'; // for example, https://github.com
    this.SCOPES = ['repo'];
  },

  /**
   * Begin
   */
  begin() {
    this.init(); // secure token params.

    let url = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri${this.REDIRECT_URL}&scope=`;

    for (let i = 0; i < this.SCOPES.length; i += 1) {
      url += this.SCOPES[i];
    }

    chrome.storage.local.set({ pipe_leethub: true }, () => {
      // opening pipe temporarily, redirects to github
      chrome.tabs.create({ url, active: true }, function () {});
    });
  },
};
