// Make the Wiki namespace
this.Wiki = {};

// Closure for neatness, if needed
(function() {
    // ******* PROPERTIES *****  \\
    Wiki.current_url = location.href;
    Wiki.page_updating = false;
    Wiki.converter = new Showdown.converter();


    // ******* CORE ******* \\
    // Load the given page of the wiki
    Wiki.loadPage = function(href) {
        // The url to work with
        var url = "";

        // The page type
        var type = "";

        // Default to the main page
        if(href == '') {
            url = 'Main';

            // Update the current url that the page is on
            Wiki.current_url = location.href.replace(/index\.html#?.+$/, "index.html#Main");
        }
        else {
            url = unescape(href);

            // Update the current url that the page is on
            if(href != '404') {
                Wiki.current_url = location.href.replace(/index\.html#?.+$/, "index.html#" + href);
            }
        }

        // If this is a category url, look under the categories folder
        if(url.match(/category:/)) {
            url = "categories/" + url.replace(/category:/, '');
            type = "category";
        }
        else {
            // Look under the content folder
            url = "content/" + url;
            type = "content";
        }

        // Now do the parsing work
        $.ajax({
            url: escape(url),
            success: function(data)
            {
                // First, check if the page is a redirect
                var redirect_match = data.match(/^REDIRECT: #(.+)$/);
                if(redirect_match) {
                    window.location = window.location.href.replace(/index\.html#.+$/, "index.html#" + redirect_match[1]);
                    return;
                }

                // Now we know we have a page to load, we grab the categories data
                categories_listing = Wiki.fetchCategories(url);

                // Find the content section
                var content_section = $('#inner_content');

                // Fade out the current content, and when finished load the next
                content_section.fadeOut('fast', function() {
                    // If this is a category, we need to list the child pages
                    if(type === "category") {
                        data = data + "\r\n"

                        for(var x in categories_listing[0]) {
                            data = data + '\r\n' + ' * ' + categories_listing[0][x];
                        }
                    }

                    // TODO: Either remove, or us to ensure expected categories
                    // Parse out the category links, so that they can be notes for now
                    data = data.replace(/^category\:(.+)$/gm, '');

                    // Parse the data
                    data = Wiki.parseContent(data)

                    // Push the content to the page
                    var content = data;
                    $('#inner_content').html(content);

                    var category_string = '';

                    for(var x in categories_listing[1]) {
                        category_string = category_string + '\r\n' + ' * ' + categories_listing[1][x];
                    }

                    var converted_cat = Wiki.converter.makeHtml(category_string);

                    $('#categories').html(converted_cat);

                    if(converted_cat == '') {
                        $('#categories').hide();
                    }
                    else {
                        $('#categories').show();
                    }

                    content_section.fadeIn('fast');
                });
            },
            error: function() {
                Wiki.loadPage("404");
            }
        });
    }

    // Fetches the category data for this url
    // If the page is content, fetches the categories it belongs to
    // If the page is a category, fetches in addition its child pages and categories
    Wiki.fetchCategories = function(url){
        // The type of content to look for
        var type = "";
        var lookup = "";

        // Data to return
        var to_return = [[], []];

        // Find out if this is a category or a content page
        var match = url.match(/^(categories|content)\/(.+)$/);

        // If there was no match, bail out
        if(match === null) {
            return to_return;
        }

        // Match, get the types
        type = match[1];
        lookup = match[2];

        // Parse the categories.yml, looking for the needed data
        $.ajax({
            url: "categories.yml",
            async: false,
            success: function(data) {
                // Split the data by the newlines
                data = data.split(/\n/);

                // Loop variables
                var i = 0;
                var index_data = null;
                var data_match = null;

                // If this is a category, look for the matching heading (no indent)
                if(type === "categories") {
                    var index_of_cat = data.indexOf(lookup + ":");

                    // Only do something if there is an index found
                    if(index_of_cat !== null) {
                        // Now we look for array entries with indenting
                        for(i = index_of_cat + 1; i < data.length; i++) {
                            // Get the data
                            index_data = data[i];

                            // Check if it has indentation
                            data_match = index_data.match(/^\s+(.*)$/);

                            // If there was no match, we break from the loop
                            if(data_match == null)
                            {
                                break;
                            }
                            else {
                                // There is data here, so build a link to it
                                data_match = data_match[1];

                                // If the data begins with !, it's a category page
                                if(data_match[0] === "!") {
                                    to_return[0].push("[" + data_match.substring(1) + "](#category:" + data_match.substring(1) + ")");
                                }
                                else {
                                    to_return[0].push("[" + data_match + "](#" + data_match + ")");
                                }
                            }
                        }
                    }
                }

                // For either category or content, find the categories that have this as an entry
                // If this is a category, change the lookup to have the ! on the front
                if(type === "categories") {
                    lookup = "!" + lookup;
                }

                // Convert to a RegExp
                var lookup_re = new RegExp("^\\s+(" + lookup + ")");

                // Loop variables
                var current_cat = "";

                // Step through the array, finding the categories and adding them to the return array as needed
                for(i = 0; i < data.length; i++) {
                    // Get the data
                    index_data = data[i];

                    // If this is a category, switch it to the current
                    data_match = index_data.match(/^([^\s].+)\:$/);
                    if(data_match !== null) {
                        current_cat = data_match[1];
                    }
                    else {
                        // If this matches the lookup, push the current cat onto the return array
                        data_match = index_data.match(lookup_re);
                        if(data_match !== null) {
                            to_return[1].push("[" + current_cat + "](#category:" + current_cat + ")");
                        }
                    }
                }
            },
            error: function() {
                // Do nothing
           }
        });

        // Return
        return to_return;
    }

    Wiki.preParse = function(data) {
        // Parse spaces out of the links
        data = Wiki.templateLinksParse(data);

        // Parse out the quick links
        data = Wiki.templateQuickLinkParse(data);

        return data;
    }

    Wiki.postParse = function(data) {
        // Parse out the infobox
        data = Wiki.templateInfoboxParse(data);

        // Parse out the class spans
        data = Wiki.templateClassSpanParse(data);

        // Parse out the colour spans
        data = Wiki.templateColourSpanParse(data);

        return data;
    }

    Wiki.parseContent = function(data) {
        // Pre-convert parsing
        data = Wiki.preParse(data);

        // Convert to html
        data = Wiki.converter.makeHtml(data);

        // Post-convert parsing
        data = Wiki.postParse(data);

        return data;
    }

    Wiki.checkURLChange = function() {
        if(Wiki.current_url != location.href && !Wiki.page_updating) {
            Wiki.doLoad();
        }
    }

    Wiki.doLoad = function() {
        Wiki.page_updating = true;

        if(location.href.toString().indexOf('#') == -1) {
            Wiki.loadPage('');
        }
        else {
            Wiki.loadPage(location.href.split('#')[1]);
        }
        Wiki.page_updating = false;
    }


    //  ******* TEMPLATES ******* \\
    // Parse out the link spaces
    // Convert [1]: #A B to [1]: #A%20B
    Wiki.templateLinksParse = function(data) {
        return data.replace(/^(\[\d+\]\: #)(.+)$/gm, function(match, m1, m2) {
            return m1 + m2.replace(/\s+/g, "%20");
        });
    }

    // Parse out the quick link syntax
    // Convert [[foo]] to [foo](#foo)
    Wiki.templateQuickLinkParse = function(data) {
        return data.replace(/\[\[([^\]]+)\]\]/g, "[$1](#$1)");
    }

    // Parse out the infobox
    // Convert <p>INFO and ENDINFO</p> into the infobox pattern
    Wiki.templateInfoboxParse = function(data) {
        var info_start = data.indexOf("<p>INFO");
        var info_end = data.indexOf("ENDINFO</p>");

        if((info_start != -1) && (info_end != -1)) {
            var info_data = data.substring(info_start, info_end + 11);
            data = data.substring(info_end + 11);

            info_data = info_data.split(/[\r\n]/g);

            // Discard the first and last items as these are the markers
            info_data.pop();
            info_data.shift();

            // Find each of the info elements
            var info_matches = new Array();
            var temp_matches;

            for(var i in info_data) {
                temp_matches = info_data[i].match(/^\|([^=]+)\=(.*)$/);
                if(temp_matches != null) {
                    info_matches.push("<dt>" + temp_matches[1] + "</dt><dd>" + temp_matches[2] + "</dd>");
                }
            }

            // Update the infobox template
            $("#infobox").html("<dl>" + info_matches.join('') + "</dl>").show();
        }
        else {
            $("#infobox").hide().html("");
        }

        return data;
    }

    // Parse out the class spans
    // Convert the !!(class){...} syntax to inline class attributes
    Wiki.templateClassSpanParse = function(data) {
        // Look for !!(class){...}
        var class_span_matches = data.match(/!!([^!]+)\{([^\}]+)\}/mg);
        var inner_match;

        for(var x in class_span_matches) {
            inner_match = class_span_matches[x].match(/!!([^!]+)\{([^\}]+)\}/);

            data = data.replace("!!"+inner_match[1]+"{"+inner_match[2]+"}", '<span class="'+inner_match[1]+'">'+inner_match[2]+'</span>');
        }

        return data;
    }

    // Parse out the colour spans
    // Convert the !!(colour){...} syntax to inline style attribute
    Wiki.templateColourSpanParse = function(data) {
        // Look for !!(colour){...}
        var colour_span_matches = data.match(/!!!([^!]+)\{([^\}]+)\}/mg);
        var inner_match;

        for(var x in colour_span_matches) {
            inner_match = colour_span_matches[x].match(/!!([^!]+)\{([^\}]+)\}/);

            data = data.replace("!!!"+inner_match[1]+"{"+inner_match[2]+"}", '<span style="color:'+inner_match[1]+';">'+inner_match[2]+'</span>');
        }

        return data;
    }


}());

setInterval(Wiki.checkURLChange, 200);
Wiki.doLoad();
