# Octohint

[![Build Status](https://travis-ci.org/pd4d10/octohint.svg)](https://travis-ci.org/pd4d10/octohint)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hbkpjkfdheainjkkebeoofkpgddnnbpk.svg)](https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/hbkpjkfdheainjkkebeoofkpgddnnbpk.svg)](https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/hbkpjkfdheainjkkebeoofkpgddnnbpk.svg)](https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk)

<img src="assets/demo.gif" alt="Demo" width="593" />

## Introduction

Octohint is a browser extension which adds IntelliSense hint for GitHub, GitLab and Bitbucket.

## Installation

### Chrome

Install it from Chrome Web Store:

https://chrome.google.com/webstore/detail/octohint/hbkpjkfdheainjkkebeoofkpgddnnbpk

Mannual install:

Go to [release page](https://github.com/pd4d10/octohint/releases), find `chrome.zip` file and download it.

### Safari

Since I have no Apple Developer Program account, Safari users should install it mannually, maybe a little complicated.

1. Download [this zip file](https://github.com/pd4d10/octohint/releases/download/v1.4.0/octohint.safariextension.zip), double click to unpack it in Finder

2. [Enable Develop tools of Safari](https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/GettingStarted/GettingStarted.html)

3. At top menubar, click Develop -> Show Extension builder, then click '+' on the bottom left corner of popup window, choose 'Add Extension', then select unpacked folder on step 1.

4. Click 'Install' button on the top right, done.

## Features

* Hover to see quick information
* Click to show all occurrences
* [⌘] + Click to show definition (For Windows and Linux user, use [Ctrl])

## Supported languages

* TypeScript and JavaScript
* CSS, LESS, SCSS
* HTML

## Options

If GitHub/GitLab/Bitbucket you are using is hosted on different site, go to chrome://extensions, click options of Octohint, then add [match patterns](https://developer.chrome.com/extensions/match_patterns) of your site, like `https://www.example.com/*`.

<img src="assets/options.png" alt="options" width="422">

## License

MIT
