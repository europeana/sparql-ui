var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.AbstractResultBrowser = ( function( $, wikibase ) {
	'use strict';

	/**
	 * Abstract result browser
	 *
	 * @class wikibase.queryService.ui.resultBrowser.AbstractResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF() {
		this._visitors = [];
	}

	/**
	 * @property {wikibase.queryService.ui.resultBrowser.helper.FormatterHelper}
	 * @private
	 */
	SELF.prototype._formatter = null;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._result = null;

	/**
	 * @property {Function}
	 * List of visitor callbacks
	 */
	SELF.prototype._visitors = null;

	/**
	 * @protected
	 * @property {boolean}
	 * Is the browser drawable?
	 * Not drawable by default.
	 */
	SELF.prototype._drawable = false;

	/**
	 * Sets the result to be browsed
	 *
	 * @param {Object} result set
	 */
	SELF.prototype.setResult = function( result ) {
		this._result = result;
	};

	/**
	 * Iterate the result set and calls the visitors
	 *
	 * @protected
	 * @param {AbstractResultBrowser~resultCallback} cb - called for every column of the resultset
	 */
	SELF.prototype._iterateResult = function( cb ) {
		var self = this;

		$.each( this._result.results.bindings, function( rowNum, row ) {
			$.each( self._result.head.vars, function( rowNum1, key ) {
				var field = row[key] || null;
				self.processVisitors( field, key );
				cb( field, key, row, rowNum );
			} );
		} );
	};

	/**
	 * Callback used by _iterateResult
	 * @param {Object} field
	 * @param {string} key of the field
	 * @param {Object} row
	 */

	/**
	 * Checks whether the result browser can draw the given result
	 *
	 * @return {boolean}
	 */
	SELF.prototype.isDrawable = function() {
		return this._drawable;
	};

	/**
	 * Draws the result browser to the given element
	 *
	 * @param {jQuery} $element to draw at
	 */
	SELF.prototype.draw = function( $element ) {
		jQuery.error( 'Method draw() needs to be implemented!' );
	};

	/**
	 * Add visitor function.
	 *
	 * @param {Function} callback
	 */
	SELF.prototype.addVisitor = function( callback ) {
		this._visitors.push( callback );
	};

	/**
	 * Reset visitors array.
	 */
	SELF.prototype.resetVisitors = function() {
		this._visitors = [];
	};

	/**
	 * Call all visitors for the piece of data
	 *
	 * @protected
	 * @param {Object} data
	 * @param {String} columnKey
	 */
	SELF.prototype.processVisitors = function( data, columnKey ) {
		var self = this,
			removeVisitors = {};

		if ( this._visitors.length === 0 ) {
			return;
		}

		$.each( this._visitors, function( key, v ) {
			if ( v.visit && typeof v.visit === 'function' ) {
				if ( v.visit( data, columnKey ) === false ) {
					removeVisitors[key] = true;
				}
			}
		} );

		// need to use filter since removal changes keys
		self._visitors = self._visitors.filter( function( value, visitorIndex ) {
			return !removeVisitors[visitorIndex];
		} );
	};

	/**
	 * Receiving data from the a visit
	 *
	 * @param {Object} data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		return false;
	};

	/**
	 * Set a formatter in order to replace the default formatter
	 *
	 * @param {wikibase.queryService.ui.resultBrowser.helper.FormatterHelper} formatter
	 */
	SELF.prototype.setFormatter = function( formatter ) {
		this._formatter = formatter;
	};

	/**
	 * Get the formatter
	 *
	 * @protected
	 * @return {wikibase.queryService.ui.resultBrowser.helper.FormatterHelper}
	 */
	SELF.prototype._getFormatter = function() {
		if ( this._formatter === null ) {
			this._formatter = new wikibase.queryService.ui.resultBrowser.helper.FormatterHelper();
		}

		return this._formatter;
	};

	/**
	 * Get an i18n string
	 *
	 * @protected
	 * @param {string} key for the i18n message
	 * @param {string} message default text
	 *
	 * @return {string}
	 */
	SELF.prototype._i18n = function( key, message ) {
		var i18nMessage = null;

		if ( !$.i18n || ( i18nMessage = $.i18n( key ) ) === key ) {
			return message;
		}

		return i18nMessage;
	};

	return SELF;
}( jQuery, wikibase ) );
