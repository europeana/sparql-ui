var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.QuerySamples = ( function ( $ ) {
	'use strict';

	/**
	 * QuerySamples API for the Europeana query service
	 *
	 * @class wikibase.queryService.api.QuerySamples
	 * @license GNU GPL v2+
	 *
	 * @author Srdjan Stevanetic
	 * @constructor
	 */
	function SELF( language, settings, sparqlUri ) {
		this._language = language;
		if ( !settings ) {
			throw new Error( 'Invalid method call: query sample settings are missing!' );
		}

		if (sparqlUri == null || sparqlUri === 'undefined') {
			throw new Error( 'Invalid method call wikibase.queryService.api.QuerySamples: sparqlUri parameter is missing!' );
		}
		this._sparqlUri=sparqlUri;
		if(this._sparqlUri.includes("wikidata.org")) {
			this._apiServer = settings.server;
			this._apiUrl = this._apiServer + settings.apiPath;
			this._pageTitle = settings.pageTitle;
			this._pageUrl = this._apiServer + settings.pagePathElement + 'Special:MyLanguage/' + this._pageTitle;
		}
		else {
			this._jsonFileEuropeana = settings.jsonFileEuropeana;	
		}		
	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._language = null;

	/**
	 * @return {jQuery.Promise} Object taking list of example queries { title:, query: }
	 */
	SELF.prototype.getExamples = function () {
		if(this._sparqlUri.includes("wikidata.org")) {
			var self = this;
			return self._parsePage(
				self._pageTitle + '/' + self._language
			).catch( function () {
				// retry without language
				return self._parsePage( self._pageTitle );
			} ).then( function ( response ) {
				return self._parseHTML( response.parse.text );
			} );
		}
		else {
			return $.getJSON( this._jsonFileEuropeana, function( examples ) {
			// group by category
  			return _.flatten( _.toArray( _.groupBy( examples, 'category' ) ) );
		});
			
		}
	};

	/**
	 * Parse the contents of a page using the API.
	 *
	 * @param {string} title page title
	 * @return {jQuery.Promise}
	 */
	SELF.prototype._parsePage = function ( title ) {
		return this._apiGet( {
			action: 'parse',
			page: title,
			redirects: '1',
			prop: 'text',
			wrapoutputclass: '',
			disableeditsection: '1',
			smaxage: '600',
			maxage: '600',
			disabletoc: '1'
			// DO NOT SET any of the following, as they unshare parser cache
			// (compare ApiParse::makeParserOptions): disablelimitreport/disablepp,
			// (section)preview, disabletidy, and wrapoutputclass != ''.
		} );
	};

	/**
	 * Make an anonymous GET request to the API,
	 * using version 2 of the JSON response format.
	 *
	 * @param {Object} params request parameters
	 * @return {jQuery.Promise}
	 */
	SELF.prototype._apiGet = function ( params ) {
		return $.getJSON( this._apiUrl, $.extend( {}, params, {
			format: 'json',
			formatversion: 2,
			origin: '*'
		} ) ).then( function ( response ) {
			if ( 'error' in response ) {
				throw response.error;
			}
			return response;
		} );
	};

	/**
	 * Find closest header element one higher than this one
	 *
	 * @param {Element} element Header element
	 * @return {null|Element} Header element
	 * @private
	 */
	SELF.prototype._findPrevHeader = function ( element ) {
		var tag = element.children( ':first' ).prop( 'tagName' );
		if ( tag[0] !== 'H' && tag[0] !== 'h' ) {
			return null;
		}
		return this._findPrev( element, '.mw-heading' + ( tag.substr( 1 ) - 1 ) );
	};

	/**
	 * Find previous element matching the selector
	 *
	 * @param {Element} element
	 * @param {string} selector
	 * @return {Element}
	 * @private
	 */
	SELF.prototype._findPrev = function ( element, selector ) {
		var prev = element.prev().filter( selector );
		if ( prev.length > 0 ) {
			return prev;
		}
		prev = element.prevUntil( selector ).last().prev();
		if ( prev.length > 0 ) {
			return prev;
		}

		prev = element.parent();
		if ( prev.length === 0 ) {
			return prev;
		}
		return this._findPrev( prev, selector );
	};

	SELF.prototype._extractTagsFromSPARQL = function ( sparql ) {
		var tags = sparql.match( /\b[QP]\d+\b/g );

		if ( !tags ) {
			return [];
		}

		return tags;
	};

	SELF.prototype._parseHTML = function ( html ) {
		var div = document.createElement( 'div' ),
			self = this;
		div.innerHTML = html;
		// Find all SPARQL Templates
		var examples = $( div ).find( '.mw-highlight' ).map( function () {
			var $this = $( this );

			$this.find( '.lineno' ).remove();

			var query = $this.text().trim();
			// Find preceding title element
			var titleEl = self._findPrev( $this, '.mw-heading2,.mw-heading3,.mw-heading4,.mw-heading5,.mw-heading6,.mw-heading7' );
			if ( !titleEl || !titleEl.length ) {
				return null;
			}
			var title = titleEl.children( ':first' ).text().trim();
			return {
				title: title,
				query: query,
				href: self._pageUrl + '#' + encodeURIComponent( title.replace( / /g, '_' ) ).replace( /%/g, '.' ),
				tags: self._extractTagsFromSPARQL( query ),
				category: self._findPrevHeader( titleEl ).text().trim()
			};
		} ).get();
		// group by category
		return _.flatten( _.toArray( _.groupBy( examples, 'category' ) ) );
	};

	/**
	 * Set the language for the query samples.
	 *
	 * @param {string} language
	 */
	SELF.prototype.setLanguage = function ( language ) {
		this._language = language;
	};

	/**
	 * Get the language for the query samples.
	 *
	 * @return {string} language
	 */
	SELF.prototype.getLanguage = function () {
		return this._language;
	};

	/**
	 * Get the URL of the page where query examples are defined.
	 *
	 * @return {string} URL
	 */
	SELF.prototype.getExamplesPageUrl = function () {
		return this._pageUrl;
	};

	return SELF;

}( jQuery ) );
