var GitHubURLRegex = 'github.com/([^/]+)/([^/]+)/(tree|blob|raw|edit)/([^/]+)/([^#]+)(#L([0-9]+))?';
var RepoPathMap = {};
var PathReplacement = { search: '', replace: '' };

chrome.storage.sync.get({
	pathReplacement: { search: '', replace: '' },
	gitHubRepoMappings: {}
}, function(items) {
	PathReplacement = items.pathReplacement;
	RepoPathMap = items.gitHubRepoMappings;
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (key in changes) {
		var storageChange = changes[key];

		if ( key === "gitHubRepoMappings" ) {
			RepoPathMap = storageChange.newValue;
		}

		if ( key === "pathReplacement" ) {
			PathReplacement = storageChange.newValue;
		}
	}
});

function openPath( path, line, column ) {

	path = path.replace( PathReplacement.search, PathReplacement.replace );

	var openURL = "subl://open?url=file://" + path + '&line=' + line;
	var openWindow = window.open( openURL );

	setTimeout( function() {
		openWindow.close();
	}, 500 );

}

function openFileInRepo( path, repo, branch, line, column ) {

	if ( typeof RepoPathMap[repo] === 'undefined' ) {

		if ( confirm( 'No mapping found for the repository ' + repo + '. Go to options to add a new one?' ) ) {
			chrome.tabs.create({'url': chrome.extension.getURL("options.html") + '?action=add-github-mapping&repo=' + repo } )
		}

		return;
	}

	return openPath( RepoPathMap[repo] + '/' + path, line, column );
}

// With a new rule ...
chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	chrome.declarativeContent.onPageChanged.addRules([
	  {
		// That fires when a page's URL contains a 'g' ...
		conditions: [
		  new chrome.declarativeContent.PageStateMatcher({
			pageUrl: { urlMatches: GitHubURLRegex },
		  })
		],
		// And shows the extension's page action.
		actions: [ new chrome.declarativeContent.ShowPageAction() ]
	  }
	]);
});

chrome.contextMenus.create( {
	title: "Open in Sublime",
	contexts: [ "link", "selection", "page" ],
	onclick: function( data, tab ) {

		if ( data.pageUrl.indexOf( 'github.com') ) {
			if ( data.linkUrl )
				return openFromGitHubURL( data.linkUrl );

			chrome.tabs.sendRequest(tab.id, {method: "getGitHubPathData"}, function(response){

				if ( response ) {
					openFromGitHubURL( data.pageUrl, response );
				} else if ( data.pageUrl ) {
					openFromGitHubURL( data.pageUrl );
				}
			});
		}

		chrome.tabs.sendRequest(tab.id, {method: "getSelectedPathData"}, function(response){

			if ( ! response )
				return;

			openPath( response.path, response.line );
		});
		
	}
});

chrome.pageAction.onClicked.addListener( function( tab ) {
	openFromGitHubURL( tab.url );
});

function openFromGitHubURL( url, pathData ) {
	var repoData = parseGitHubURL( url );

	if ( ! pathData )
		pathData = {};

	jQuery.extend( repoData, pathData );

	openFileInRepo( repoData.path, repoData.repo, repoData.branch, repoData.line );
}

function parseGitHubURL( url ) {
	var parser = document.createElement('a');
	parser.href = url;

	var matches = url.match( GitHubURLRegex );

	if ( matches ) {
		return {
			repo: matches[2],
			branch: matches[4],
			path: matches[5],
			line: typeof matches[7] === 'undefined' ? 0 : matches[7],
			column: 0
		}
	}
	
	var matches = url.match( 'github.com/([^/]+)/([^/]+)' );

	if ( matches ) {
		return {
			repo: matches[2],
		}
	}

	return {

	}
}

