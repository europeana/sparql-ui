var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.editor = wikibase.queryService.ui.editor || {};
wikibase.queryService.ui.editor.tooltip = wikibase.queryService.ui.editor.tooltip || {};

wikibase.queryService.ui.editor.tooltip.Rdf = ( function ( CodeMirror, $, _ ) {
	'use strict';

	/**
	 * Wikibase RDF tooltip for codemirror editor
	 *
	 * @license GNU GPL v2+
	 * @class wikibase.queryService.ui.editor.tooltip.Rdf
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {wikibase.queryService.ui.editor.tooltip.TooltipRepository} tooltipRepository
	 */
	function SELF( tooltipRepository, api, rdfNamespaces, sparqlUri ) {
		this._tooltipRepository = tooltipRepository;
		this._api = api;
		this._rdfNamespaces = rdfNamespaces;

		if ( !this._api ) {
			this._api = new wikibase.queryService.api.Wikibase();
		}

		if ( !this._rdfNamespaces ) {
			this._rdfNamespaces = wikibase.queryService.RdfNamespaces;
		}
		
		if ( !sparqlUri ) {
			throw new Error( 'Invalid method call wikibase.queryService.ui.editor.tooltip.Rdf: sparqlUri parameter is missing!' );
		}
		this._sparqlUri=sparqlUri;
		if(this._sparqlUri == null || this._sparqlUri === 'undefined') {
			throw new Error( 'Invalid sparqlUri parameter in the method wikibase.queryService.ui.editor.tooltip.Rdf!' )
		}
	}

	/**
	 * @property {wikibase.queryService.RdfNamespaces}
	 * @private
	 */
	SELF.prototype._rdfNamespaces = null;

	/**
	 * @property {CodeMirror}
	 * @private
	 */
	SELF.prototype._editor = null;

	/**
	 * Set the editor the onmouseover callback is registered to
	 *
	 * @param {CodeMirror} editor
	 */
	SELF.prototype.setEditor = function ( editor ) {
		this._editor = editor;
		this._registerHandler();
	};

	SELF.prototype._registerHandler = function () {
		var self = this;

		CodeMirror.on( this._editor.getWrapperElement(), 'mouseover', _.debounce( function ( e ) {
			self._triggerTooltip( e );
		}, 300 ) );
	};// TODO: Remove CodeMirror dependency

	SELF.prototype._triggerTooltip = function ( e ) {
		this._removeToolTip();
		this._createTooltip( e );
	};

	SELF.prototype._createTooltip = function( e ) {
		if(this._sparqlUri.includes("wikidata.org")) {
			var posX = e.clientX,
				posY = e.clientY + $( window ).scrollTop(),
				token = this._editor.getTokenAt( this._editor.coordsChar( {
					left: posX,
					top: posY
				} ) ).string;
	
			if ( !token.match( /.+\:(Q|P|L)[0-9]+$/ ) ) {
				return;
			}
	
			var prefixes = this._extractPrefixes( this._editor.doc.getValue() );
			var prefix = token.split( ':', 1 )[0];
			var entityId = token.split( ':' ).pop();
	
			if ( !prefixes[prefix] ) {
				return;
			}
	
			var self = this;
			this._tooltipRepository.getTooltipContentForId( entityId ).then( function ( content ) {
				self._showToolTip( content, {
					x: posX,
					y: posY
				} );
			} );
		}
		else {
			var posX = e.clientX,
				posY = e.clientY + $( window ).scrollTop(),
				token = this._editor.getTokenAt( this._editor.coordsChar( {
					left: posX,
					top: posY
				} ) ).string;
	
			if ( !token.match( /.+\:.+/ ) ) {
				return;
			}
	
			var self = this;
			this._searchEntities( token ).done( function( list ) {
				self._showToolTip( list.shift(), {
					x: posX,
					y: posY
				} );
			} );
		}

	};

	SELF.prototype._removeToolTip = function () {
		$( '.wikibaseRDFtoolTip' ).remove();
	};

	SELF.prototype._showToolTip = function ( $content, pos ) {
		if ( !$content || !pos ) {
			return;
		}

		$( '<div class="panel panel-info">' ).css( 'position', 'absolute' ).css( 'z-index', '100' )
			.css( 'max-width', '200px' ).css( {
				top: pos.y + 2,
				left: pos.x + 2
			} ).addClass( 'wikibaseRDFtoolTip' ).append(
				$( '<div class="panel-body">' ).append( $content ).css( 'padding', '10px' ) )
			.appendTo( 'body' ).fadeIn( 'slow' );
	};

	SELF.prototype._extractPrefixes = function ( text ) {
		var prefixes = this._rdfNamespaces.getPrefixMap( this._rdfNamespaces.ENTITY_TYPES ),
			lines = text.split( '\n' ),
			matches;

		var self = this;
		$.each( lines, function ( index, line ) {
			// PREFIX wd: <http://www.wikidata.org/entity/>
			if ( ( matches = line.match( /(PREFIX) (\S+): <([^>]+)>/ ) ) ) {
				if ( self._rdfNamespaces.ENTITY_TYPES[matches[3]] ) {
					prefixes[matches[2]] = self._rdfNamespaces.ENTITY_TYPES[matches[3]];
				}
			}
		} );

		return prefixes;
	};

	SELF.prototype._searchEntities = function( term, type ) {
		if(this._sparqlUri.includes("wikidata.org")) {
			var entityList = [],
				deferred = $.Deferred();
	
			this._api.searchEntities( term, type ).done(
					function( data ) {
						$.each( data.search, function( key, value ) {
							entityList.push(
								$()
									.add( document.createTextNode( value.label + ' (' + value.id + ')' ) )
									.add( $( '<br>' ) )
									.add( $( '<small>' ).text( value.description || '' ) )
							);
						} );
	
						deferred.resolve( entityList );
					} );
	
			return deferred.promise();			
		}
		else {
			var entityList = [],
				deferred = $.Deferred();
	
			this._api.searchEntities( term, type ).done(
					function( data ) {
						$.each( data.search, function( key, value ) {
							var aTagOrText = null;					    
						    if(value.reference) {
								aTagOrText = document.createElement('a');
								aTagOrText.target = '_blank';
								aTagOrText.href = value.reference;
								aTagOrText.innerText = value.label ? value.label + ' (' + value.id + ')' : value.id;
							}
							else {
								aTagOrText = document.createTextNode(value.label ? value.label + ' (' + value.id + ')' : value.id);
							}
	
							entityList.push(
								$()
									.add( aTagOrText )
									.add( $( '<br>' ) )
									.add( $( '<small>' ).text( value.description || '' ) )
							);
						} );
	
						deferred.resolve( entityList );
					} );
	
			return deferred.promise();
		}
		
	};

	return SELF;

}( CodeMirror, jQuery, _ ) );
