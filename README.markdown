mWiki - Miniature, Portable Wiki Software
=========================================

Introduction
------------

mWiki is a miniature, portable wiki software driven by a Javascript backend and rendered through
HTML paegs, with Markdown <http://daringfireball.net/projects/markdown/> providing the content
syntax. It is intended for use on systems with minimal applications or with restricted access to
both the Internet and rights to install applications.

Features
--------

mWiki has the following features:

* Light-weight
* Minimal dependencies (most freshly-installed OSs can use it)
* Portable (uses the filesystem as a store of content)
* Uses a well-defined format (Markdown) to define content

Missing Features
----------------

However, mWiki lacks the following things that you see in other wiki software:

* Versioning (can be replicated through use of VCS)
* Searching (planned for the future)
* Templates (a simple Infobox is available; more possible in the future)
* Users and permissions (not possible, save for permissions to network shares and the like)
* Live, inline editing (not possible; javascript has no access to the filesystem)

System Requirements
-------------------

Installation of mWiki is nothing more than a simple file copy, meaning that you may install and run
mWiki from any location that your user account has read/write access to. For mobility (as it was
designed for) a copy can be kept on a USB drive, in a DropBox (http://www.dropbox.com) folder, or on
a network server or other central, remote file system. In particular, a copy could be committed to a
Version Control System repository, allowing for histroy of revisions to be kept.

In general, the only requirements for viewing an instance of mWiki are a semi-modern browser that is
capable of rendering HTML pages and running Javascript. The Javascript itself is simplistic, so
there should be few issues with differing Javascript behaviour between browsers.

For editting of content, a simple text editor and a knowledge of Markdown are all that are needed.

Libraries
---------

The following libraries are used and bundled with mWiki:

* Showdown (http://attacklab.net/showdown/) is used to convert the Markdown into the content HTML.
* JQuery (http://jquery.com/) is used to make the manipulation of the page elements easier.
* The Meyerweb Reset CSS <http://meyerweb.com/eric/tools/css/reset/> was used to ease the creation
  of the page styling.

Once the feature set of the wiki is more stable, I will be upgrading versions of these to the
latest; in particular, the current version of JQuery used is 1.4.2, which is good enough for my
needs at the moment. To my knowledge though, there is no code that does, or will ever, tie this wiki
to old versions of libraries.

Installation
------------

Download the code in this repository, either forking it or just taking the download of the code.
Place the code where you want, and then begin adding content.

Usage
-----

The guide for usage is written into the current wiki content. Using these pages as reference and
templates, add your own files and content. To get started, open the index.html file in a
javascript-enabled web browser.

Future
------

Once development has gone a little further, I'll put a small plan of future development here.

Note on Patches/Pull Requests
-----------------------------

* Fork the project.
* Make your feature addition or bug fix.
* Commit, do not mess with version or history.
  (if you want to have your own version, that is fine but bump version in a commit by itself I can
  ignore when I pull)
* Send me a pull request. Bonus points for topic branches.

If you're thinking of adding a new feature, send me a message first to make sure I'm not already
working on it first.

Copyright
---------

Copyright (c) 2010 Mike Brown. See LICENSE for details.

JQuery is (c) The Jquery Project
