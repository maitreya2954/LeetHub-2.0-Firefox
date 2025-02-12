<h1 align="center">
  <a href="https://standardjs.com"><img src="assets/octocode.png" alt="LeetHub 2.0 - Automatically sync your code to GitHub." width="400"></a>
  <br>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/leethub-2-0-for-firefox/">LeetHub 2.0</a> - Automatically sync your code to GitHub.
  <br>
  <br>
</h1>

<p align="center">
  <a href="https://github.com/maitreya2954/LeetHub-2.0-Firefox/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"/>
  </a>
  <!-- <a href="https://discord.gg/anXT9vErxu">
    <img src="https://img.shields.io/discord/781373810251137074" alt="discord">
  </a> -->
  <!-- <a href="https://chrome.google.com/webstore/detail/leethub/aciombdipochlnkbpcbgdpjffcfdbggi">
    <img src="https://img.shields.io/chrome-web-store/v/aciombdipochlnkbpcbgdpjffcfdbggi.svg" alt="chrome-webstore"/>
  </a> -->
  <!-- <a href="https://chrome.google.com/webstore/detail/leethub/aciombdipochlnkbpcbgdpjffcfdbggi">
    <img src="https://img.shields.io/chrome-web-store/d/aciombdipochlnkbpcbgdpjffcfdbggi.svg" alt="users">
  </a>
  <a href="https://github.com/arunbhardwaj/LeetHub-1.1/graphs/contributors" alt="Contributors">
    <img src="https://img.shields.io/github/contributors/arunbhardwaj/LeetHub-1.1" />
  </a> -->
</p>

<!-- <div align="center">
  <a href="https://www.producthunt.com/posts/leethub?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-leethub" target="_blank">
    <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=275757&theme=light" alt="LeetHub - Automatically sync your code b/w Leetcode & GitHub. | Product Hunt" />
  </a>

  [![Chrome](https://user-images.githubusercontent.com/53124886/111952712-34f12300-8aee-11eb-9fdd-ad579a1eb235.png)](https://chrome.google.com/webstore/detail/leethub/aciombdipochlnkbpcbgdpjffcfdbggi) [![Firefox](https://user-images.githubusercontent.com/53124886/126341427-4a4e57aa-767a-467e-83d2-b31fa3564441.png)](https://addons.mozilla.org/en-US/firefox/addon/leethub/)
</div> -->

<!-- ## LeetHub progress and numbers (YouTube Video):
[![LeetHub](https://user-images.githubusercontent.com/43754306/165053510-a757c95e-c3bc-49d5-995c-7a52368abd37.png)](https://www.youtube.com/watch?v=o33PIjqlOgw "LeetHub saves lives!") -->

## What is LeetHub 2.0?
<p>A Firefox Addon that automatically pushes your code to GitHub when you pass all tests on a <a href="http://leetcode.com/">Leetcode</a> problem. It's forked from the original <a href="https://chromewebstore.google.com/detail/leethub-v2/mhanfgfagplhgemhjfeolkkdidbakocm?hl=en">LeetHub v2</a> and made compatible with Firefox. Shout out to <a href="https://github.com/arunbhardwaj/LeetHub-2.0">arunbhardwaj</a> and <a href="https://github.com/QasimWani/LeetHub">QasimWani</a></p>

## Why LeetHub?
<p> <strong>1.</strong> Recruiters <em>want</em> to see your contributions to the Open Source community, be it through side projects, solving algorithms/data-structures, or contributing to existing OS projects.<br>
As of now, GitHub is developers' #1 portfolio. LeetHub just makes it much easier (autonomous) to keep track of progress and contributions on the largest network of engineering community, GitHub.</p>

<p> <strong>2.</strong> There's no easy way of accessing your leetcode problems in one place! <br>
Moreover, pushing code manually to GitHub from Leetcode is very time consuming. So, why not just automate it entirely without spending a SINGLE additional second on it? </p>

## How does LeetHub work?     

<p>It's as simple as:</p>
<ol>
  <li>After installation, launch LeetHub.</li>
  <li>Click on "authorize with GitHub" button to automatically set up your account with LeetHub.</li>
  <li>Setup an existing/new repository with LeetHub (private by default) by clicking "Get Started" button.</li>
  <li>Begin Leetcoding! To view your progress, simply click on the addon!</li>
</ol>


#### BONUS: Star [this repository](https://github.com/maitreya2954/LeetHub-2.0-Firefox) for further development of features. If you want a particular feature, simply [request](https://github.com/maitreya2954/LeetHub-2.0-Firefox/labels/feature) for it!

# Let's see you ACE that coding interview!

![leetcode view](assets/extension/leetcode_updated.png)

## Why did I build Leethub 2.0 for Firefox

When I started leetcoding to prepare for interviews. I wanted a way to store all my solutions. I found out about LeetHub and LeetHubV2. But being a ardent firefox user, I couldnt find a working firefox addon which does the job. So, I migrated the chrome extension to firefox.

# How to set up LeetHub for local development?

<ol>
  <li>Fork this repo and clone to your local machine</li>
  <li>Run "npm run setup" to install the developer dependencies</li>
  <li>Run `npm run build` to build the final addon files into the `./dist/` directory</li>
  <li>Go to <a href="about://debugging">about:debugging</a> </li>
  <li>Click on <a>This firefox</a> present in the setup section</li> 
  <li>Click 'Load Temporary Add-on'</li>
  <li>Select any file in `./dist/` LeetHub folder</li>
  <li>That's it! Be sure to `npm run build` and reload the addon after making changes</li>
</ol>

Other npm commands available:

```
npm run               Show list of commands available
npm run format        Auto-format JavaScript, HTML/CSS
npm run format-test   Test all code is formatted properly
npm run lint          Lint JavaScript
npm run lint-test     Test all code is linted properly
```
