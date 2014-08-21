chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	
	if (request.method != "getGitHubPathData")
		return;

	var parent = jQuery( window.getSelection().getRangeAt(0).startContainer.parentNode );

	// search for selected line in a code block
	if ( typeof window.getSelection().getRangeAt(0).startContainer.parentNode.children[0] != 'undefined' && window.getSelection().getRangeAt(0).startContainer.parentNode.children[0].getAttribute('data-line') ) {

		var parent = window.getSelection().getRangeAt(0).startContainer.parentNode
		var line = Number( parent.children[0].getAttribute('data-line') )
		var path = parent.children[0].getAttribute( 'data-path' );

		return sendResponse( { path: path, line: typeof line == 'undefined' ? 0 : line, column: 0 } );
	} else if ( parent.closest('td').attr( 'id' ) && parent.closest('td').attr( 'id' ).match( 'LC[0-9]+') ) {
		var line = Number( parent.closest('td').attr( 'id' ).match( 'LC([0-9]+)')[1] );
		return sendResponse( { line: line, column: 0 } );

	}
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	
	if (request.method != "getSelectedPathData")
		return;
	
	// search for selected path
	if ( window.getSelection().toString() ) {

		var selectionRange = window.getSelection().getRangeAt(0);
		expand(selectionRange);
		var word = selectionRange.toString().trim();	

		if ( word.match('/') ) {
			var pathData = { path: word, line: 0, column: 0 };

			// try find a line number too
			if ( selectionRange.startContainer.parentNode.parentNode.textContent.match( 'on line ([0-9]+)' )[1] ) {
				pathData.line = Number( selectionRange.startContainer.parentNode.parentNode.textContent.match( 'on line ([0-9]+)' )[1] );
			}

			sendResponse( pathData );
		}
	}
});

function expand(range) {
    if (range.collapsed) {
        return;
    }

    while (range.toString()[0].match(/\S/) && range.startOffset >= 1 ) {
        range.setStart(range.startContainer, range.startOffset - 1);   
    }

    while (range.toString()[range.toString().length - 1].match(/\S/) && range.endOffset < range.endContainer.length ) {
        range.setEnd(range.endContainer, range.endOffset + 1);
    }
}