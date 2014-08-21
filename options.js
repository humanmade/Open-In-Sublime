$( document ).ready(function() {
	$('.menu a').click(function(ev) {
		ev.preventDefault();
		var selected = 'selected';

		$('.mainview > *').removeClass(selected);
		$('.menu li').removeClass(selected);
		setTimeout(function() {
			$('.mainview > *:not(.selected)').css('display', 'none');
		}, 100);

		$(ev.currentTarget).parent().addClass(selected);
		var currentView = $($(ev.currentTarget).attr('href'));
		currentView.css('display', 'block');
		setTimeout(function() {
			currentView.addClass(selected);
		}, 0);

		setTimeout(function() {
			$('body')[0].scrollTop = 0;
		}, 200);
	});

	jQuery( '.save' ).click( save_options );

	restore_options();

	jQuery( document ).on( 'click', '.delete-repo-mapping', function(e) {
		e.preventDefault();
		jQuery( this ).closest( 'li' ).remove();
	})

	jQuery( '.add-repo-mapping' ).click( function(e) {
		e.preventDefault();
		addNewGitHubMappingRow();
	})

	setTimeout( function() {
		var vars = getUrlVars();

		if ( vars.action && vars.action == 'add-github-mapping' ) {
			$('.menu a[href="#github-mappings"]').click();
			var newItem = addNewGitHubMappingRow();
			newItem.find( 'input[name="githubMappings[][repo]"]' ).val( vars.repo )
			newItem.find( 'input[name="githubMappings[][path]"]' ).focus();
		}

	}, 100 );
	
}) 

function addNewGitHubMappingRow() {
	var newItem = jQuery( '#github-mappings-list li:last-child' ).clone();
	newItem.find( 'input' ).val( '' );
	newItem.insertAfter( '#github-mappings-list li:last-child' );
	return newItem;
}

function save_options() {
	var pathReplacement = {
		search: jQuery( 'input[name="pathReplacement[search]"]').val(),
		replace: jQuery( 'input[name="pathReplacement[replace]"]').val()
	};

	var gitHubRepoMappings = {};

	jQuery( '#github-mappings-list li' ).each( function( i, item ) {
		item = jQuery( item );

		if ( item.find( 'input' ).val() > "" ) {
			gitHubRepoMappings[ item.find( 'input[name="githubMappings[][repo]"]').val() ] = item.find( 'input[name="githubMappings[][path]"]').val()
		}
	});

	chrome.storage.sync.set({
		pathReplacement: pathReplacement,
		gitHubRepoMappings: gitHubRepoMappings
	}, function() {
		// Update status to let user know options were saved.
		jQuery( '.save' ).text( 'Saved!');
		setTimeout(function() {
			jQuery( '.save' ).text( 'Save');
		}, 1500);
	});
}

function restore_options() {
	chrome.storage.sync.get({
		pathReplacement: { search: '', replace: '' },
		gitHubRepoMappings: {}
	}, function(items) {
		jQuery( 'input[name="pathReplacement[search]"]').val( items.pathReplacement.search );
		jQuery( 'input[name="pathReplacement[replace]"]').val( items.pathReplacement.replace );

		var been = false;
		jQuery.each( items.gitHubRepoMappings, function( key, value ) {

			if ( been ) {
				var newItem = addNewGitHubMappingRow();
			} else {
				var newItem = jQuery( '#github-mappings-list li:last-child' );
			}

			newItem.find( 'input[name="githubMappings[][repo]"]').val( key );
			newItem.find( 'input[name="githubMappings[][path]"]').val( value );

			been = true;
		} );
	});
}

function getUrlVars() {
    var vars = {}, hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}