var current_url = location.href;
var page_updating = false;
var converter = new Showdown.converter();

//  ******* CORE ******* \\
// Load the given page of the wiki
function loadPage(href)
{
    // Default to the main page
    if(href == '')
    {
	url = 'Main';
	// Update the current url that the page is on
	current_url = location.href.replace(/index\.html#?.+$/, "index.html#Main");
    }
    else
    {
	url = unescape(href);

	// Update the current url that the page is on
	if(href != '404')
	{
	    current_url = location.href.replace(/index\.html#?.+$/, "index.html#" + href);
	}
    }

    // If this is a category url, replace 'category:' with '_'
    if(url.match(/category:/))
    {
	url = url.replace(/category:/, '_');
    }

    $.ajax(
    {
	url: 'content/' + escape(url),
	success: function(data)
	{
	    // First, check if the page is a redirect
	    var redirect_match = data.match(/^REDIRECT: #(.+)$/);
	    if(redirect_match)
	    {
		window.location = window.location.href.replace(/index\.html#.+$/, "index.html#" + redirect_match[1]);
		return;
	    }

	    var content_section = $('#inner_content');

	    content_section.fadeOut('fast', function()
	    {
		// If this is a category page, we need to add in the links
		if(url.match(/_(.+)/g))
		{
		    $.ajax(
		    {
			// Need to be synchronous to block the function below (outside the previous if)
			async: false,
			url: 'categories/' + escape(url.substring(1)),
			success: function(listing)
			{
			    var links = listing.match(/(.+)/g);
			    var category_listing = '';
			    var link = '';
			    var matches = [];

			    for(var x in links)
			    {
				link = links[x];
				matches = link.match(/^([^#]+)#(.+)$/)

				if(matches.length != 0)
				{
				    category_listing = category_listing + '\n[' + matches[1] + '](#' + matches[2] + ')';
				}
			    }

			    data = data + '\n' + category_listing;
			}
		    });
		}

		// Parse out the category links
		var categories = data.match(/^category\:(.+)$/gm);
		data = data.replace(/^category\:(.+)$/gm, '');

		// Preprocess all the referenced links to replace space with %20
		data = data.replace(/^(\[\d+\]\: #)(.+)$/gm, function(match, m1, m2)
		{
		    return m1+m2.replace(/\s+/g, "%20");
		});

                // Parse the data
                data = parseContent(data)

		// Push the content to the page
		var content = data;
		$('#inner_content').html(content);

		var category_string = '';

		for(var x in categories)
		{
		    category_string = category_string + '\r\n' + ' * ['+ categories[x].replace(/category:/, '') + '](#' + categories[x] + ')';
		}

		var converted_cat = converter.makeHtml(category_string);

		$('#categories').html(converted_cat);

		if(converted_cat == '')
		{
                    $('#categories').hide();
		}
		else
		{
                    $('#categories').show();
		}

		content_section.fadeIn('fast');
	    });
	},
	error: function()
	{
	    loadPage("404");
	}
    });
}

function preParse(data)
{
    // Parse out the quick links
    data = templateQuickLinkParse(data);

    return data;
}

function postParse(data)
{
    // Parse out the infobox
    data = templateInfoboxParse(data);

    // Parse out the class spans
    data = templateClassSpanParse(data);

    // Parse out the colour spans
    data = templateColourSpanParse(data);

    return data;
}

function parseContent(data)
{
    // Pre-convert parsing
    data = preParse(data);

    // Convert to html
    data = converter.makeHtml(data);

    // Post-convert parsing
    data = postParse(data);

    return data;
}

setInterval('checkURLChange()', 200);
function checkURLChange()
{
    if(current_url != location.href && !page_updating)
    {
	doLoad();
    }
}
function doLoad()
{
    page_updating = true;
    if(location.href.toString().indexOf('#') == -1)
    {
	loadPage('');
    }
    else
    {
	loadPage(location.href.split('#')[1]);
    }
    page_updating = false;
}
doLoad();


//  ******* TEMPLATES ******* \\

// Parse out the quick link syntax
// Convert [[foo]] to [foo](#foo)
function templateQuickLinkParse(data)
{
    return data.replace(/\[\[([^\]]+)\]\]/g, "[$1](#$1)");
}

// Parse out the infobox
// Convert <p>INFO and ENDINFO</p> into the infobox pattern
function templateInfoboxParse(data)
{
    var info_start = data.indexOf("<p>INFO");
    var info_end = data.indexOf("ENDINFO</p>");

    if((info_start != -1) && (info_end != -1))
    {
        var info_data = data.substring(info_start, info_end + 11);
        data = data.substring(info_end + 11);

        info_data = info_data.split(/[\r\n]/g);

        // Discard the first and last items as these are the markers
        info_data.pop();
        info_data.shift();

        // Find each of the info elements
        var info_matches = new Array();
        var temp_matches;

        for(var i in info_data)
        {
            temp_matches = info_data[i].match(/^\|([^=]+)\=(.*)$/);
            if(temp_matches != null)
            {
                info_matches.push("<dt>" + temp_matches[1] + "</dt><dd>" + temp_matches[2] + "</dd>");
            }
        }

        // Update the infobox template
        $("#infobox").html("<dl>" + info_matches.join('') + "</dl>").show();
    }
    else
    {
        $("#infobox").hide().html("");
    }

    return data;
}

// Parse out the class spans
// Convert the !!(class){...} syntax to inline class attributes
function templateClassSpanParse(data)
{
    // Look for !!(class){...}
    var class_span_matches = data.match(/!!([^!]+)\{([^\}]+)\}/mg);
    var inner_match;

    for(var x in class_span_matches)
    {
	inner_match = class_span_matches[x].match(/!!([^!]+)\{([^\}]+)\}/);

	data = data.replace("!!"+inner_match[1]+"{"+inner_match[2]+"}", '<span class="'+inner_match[1]+'">'+inner_match[2]+'</span>');
    }

    return data;
}

// Parse out the colour spans
// Convert the !!(colour){...} syntax to inline style attribute
function templateColourSpanParse(data)
{
    // Look for !!(colour){...}
    var colour_span_matches = data.match(/!!!([^!]+)\{([^\}]+)\}/mg);
    var inner_match;

    for(var x in colour_span_matches)
    {
        inner_match = colour_span_matches[x].match(/!!([^!]+)\{([^\}]+)\}/);

        data = data.replace("!!!"+inner_match[1]+"{"+inner_match[2]+"}", '<span style="color:'+inner_match[1]+';">'+inner_match[2]+'</span>');
    }

    return data;
}

//  ******* SEARCH ******* \\

function search(term)
{

}


function searchTitle(title)
{
  // First, split the title on spaces

  // Now, for each of the words making up the title, check if the word is either a title or included in a title

  // If it is, score it

  // If not, next

  // Return the titles and combined scores, weighted to those that have more than one word
}
