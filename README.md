# Octohint

[![Build Status](https://travis-ci.org/pd4d10/octohint.svg)](https://travis-ci.org/pd4d10/octohint)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hbkpjkfdheainjkkebeoofkpgddnnbpk.svg)](https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/hbkpjkfdheainjkkebeoofkpgddnnbpk.svg)](https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/hbkpjkfdheainjkkebeoofkpgddnnbpk.svg)](https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk)

<img src="assets/demo.gif" alt="Demo" width="593" />

## Introduction

Octohint is a browser extension which brings VSCode's IntelliSense hint to GitHub. Used to be named as Intelli-octo.

## Installation

### Chrome

Install it from [Chrome Web Store](https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk)

Manual install is also available: Go to [release page](https://github.com/pd4d10/octohint/releases), find `chrome.zip` file and download it.

### Firefox

Make sure your version of Firefox supports web extensions. The installation is the same as Manual install of Chrome.

### Safari

1. Download [this zip file](https://github.com/pd4d10/octohint/releases/download/v1.6.0/octohint.safariextension.zip), double click to unpack it in Finder

2. [Enable Develop tools of Safari](https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/GettingStarted/GettingStarted.html)

3. At top menubar, click Develop -> Show Extension builder, then click '+' on the bottom left corner of popup window, choose 'Add Extension', then select unpacked folder on step 1.

4. Click 'Install' button on the top right, done.

## Features

With Octohint installed, when you view code at GitHub (For example [this](https://github.com/pd4d10/octohint/blob/master/assets/demo.ts)), you'll get features as follows:

* Hover to see quick information
* Click to show all occurrences
* [⌘] + Click to go to definition (For Windows and Linux user, use [Ctrl])

## Supported languages

Rich IntelliSense hint:

* TypeScript and JavaScript
* CSS, LESS and SCSS

Base token matching: All languages

## Supported platforms

Support GitHub, GitLab and Bitbucket. Since GitLab CE has many versions, I'm not sure it works correctly on every version. If you find some bugs you could [submit an issue](https://github.com/pd4d10/octohint/issues/new).

## Get private GitHub/GitLab/Bitbucket works

If GitHub/GitLab/Bitbucket you are using is hosted on different site, go to chrome://extensions, click options of Octohint, then add [match patterns](https://developer.chrome.com/extensions/match_patterns) of your site, like `https://www.example.com/*`.

<img src="assets/options.png" alt="options" width="422">

## Privacy

Octohint is a pure client thing. All code analysis are performed at your browser, which means your code and actions like click, mousemove will never be sent to any server. So feel free to use it at your private GitHub/GitLab/Bitbucket.

## License

MIT
