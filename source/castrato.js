/**
 * Licensed under the MIT License
 * 
 * Copyright (c) 2014 Pehr Boman (github.com/unkelpehr)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/** @license Licenced under MIT - castrato - ©2014 Pehr Boman <github.com/unkelpehr> */
(function (self, factory) {
    if (typeof define === 'function' && define.amd) {
    	// AMD. Register as an anonymous module.
        define([], factory());
    } else if (typeof exports === 'object') { // Node
        module.exports = factory;
    } else {
    	// Attaches to the current context.
        self.castrato = factory;
  	}
}(this, (function () {
	var
		/**
		 * Contains the next unique node id.
		 *
		 * @property index
		 * @type {Integer}
		 * @private
		 */
		index = 0,

		/**
		 * Contains all subscriptions
		 *
		 * @property subs
		 * @type {Object}
		 * @private
		 */
		subs = {},

		/**
		 * Contains all emits that has been done with the `persistent` parameter set to `true`.
		 *
		 * @property emits
		 * @type {Object}
		 * @private
		 */
		emits = {},
		pending = {},

		/**
		 * An empty function that does not accept any arguments.
		 * 
		 * @property noop
		 * @type {function}
		 * @private
		 */
		noop = function () {},

		undef,

		subordinate = setTimeout;

	/**
	 * Creates a new entry in the `subs` object.
	 *
	 * @method on
	 * @private
	 * @param {Integer} fromId The unique subscriber ID.
	 * @param {String} event The event to subscribe to.
	 * @param {Function} handler A function to execute when the event is triggered.
	 */
	function on (fromId, event, handler, once) {
		var i, item, subscription = [fromId, handler, handler.length > 1];

		// Create if needed a namespace for this event and push the subscription.
		(subs[event] || (subs[event] = [])).push(subscription);

		if (pending[event]) {
			i = 0;
			while ((item = pending[event][i++])) {
				item.subs.push(subscription);
				item.subsLen++;
			}
		}

		// If it exists a persistent event that matches that which is currently being bound;
		// loop through and each of them and emit to this handler.
		if (emits[event]) {
			i = 0;
			subscription = [subscription];
			while ((item = emits[event][i++])) {
				emit({
					data: item[0],
					callback: item[1],
					explicit: subscription
				});

				if (once) {
					break;
				}
			}
		}
	}

	/**
	 * Removes all event handlers originating from `fromId` and optionally filter by handler.
	 *
	 * @method off
	 * @private
	 * @param {Integer} fromId The unique subscriber ID.
	 * @param {String} event The event to unsubscribe from.
	 * @param {Function} [handler=null] The original handler that was attached to this event. If not passed, all subscriptions will be removed.
	 */
	function off (fromId, event, handler) {
		var sub,
			toSubs,
			pendingEvents,
			pendingEvent,
			item,
			i, x;

		if ((toSubs = subs[event])) {
			i = 0;
			while ((sub = toSubs[i++])) {
				if (sub[0] === fromId && (!handler || handler === sub[1])) {
					toSubs.splice(--i, 1);
				}
			}
		}

		if ((pendingEvents = pending[event])) {
			i = 0;
			while ((pendingEvent = pendingEvents[i++])) {
				x = 0;
				while ((sub = pendingEvent.subs[x++])) {
					if (sub[0] === fromId && (!handler || handler === sub[1])) {
						pendingEvents[i - 1].subs.splice(--x, 1);
						pendingEvents[i - 1].subsLen--;
					}
				}
			}
		}
	}

	/**
	 * Loops through all subscriptions, calling all handlers attached to given `event`.
	 *
	 * @method emit
	 * @private
	 * @param {Integer} fromId The unique subscriber ID.
	 * @param {String} event The event to emit
	 * @param {Object} [data=undefined] Parameters to pass along to the event handler.
	 * @param {Function} [handler=undefined] A function to execute when all event handlers has returned.
	 */
	function emit (e) {
		subordinate(function() {
			var sub,
				total = e.subsLen,
				left = total,
				index = 0,
				answers = [],
				done;

			// Destroy the config method because at this point it has no function.
			e.from.config = undef;

			// Don't continue setup for calling all the subscribers if there isn't any.
			if (left) {
				// If the emit function does not include a callback;
				// we still have to set `done` to `noop` so that event handlers
				// does not try to execute something that is not a function.
				done = !e.callback ? noop : function (data) {
					if (data !== undef) {
						answers.push(data);
					}

					if (!--left) {
						e.callback(answers, total);
						e.callback = 0;
					}
				};

				// Execute all handlers that are bound to this event.
				// Passing `done` if the handler expects it - otherwise decrementing the `left` variable.
				while (index < e.subsLen && (sub = e.subs[index++])) {
					sub[1](e.data, sub[2] ? done : left--);
				}
			}

			// Save this emit if the `persistent` parameter is set to `true`.
			if (e.persistent) {
				(emits[e.name] || (emits[e.name] = [])).push([e.data, e.callback]);
			}

			// `func` get destructed when called.
			// It has to be called at least once - even if no one was subscribing.
			// Execute it if it still exists.
			if (!left && e.callback) {
				e.callback(answers, total);
			}

			pending[e.name].pop();
		});

		(pending[e.name] || (pending[e.name] = [])).push(e);

		// Because the emitting is done in the event thread
		// we have to save the subscribers at this state.
		// 
		// node.on('something', onSomething);
		// node.emit('something');
		// node.on('something', onSomething);
		//
		// `onSomething` would be called twice otherwise.
		e.subs = e.explicit || subs[e.name] || [];
		e.subsLen = e.subs.length;


		// Add the `config` method to the host node.
		// It will be destroyed when the emit has begun.
		e.from.config = function (opts) {
			e.persistent = opts.persistent;
			e.callback = opts.callback;
			return e.from;
		};

		// Return e.from so that the user can chain after emit calls.
		return e.from;
	}

	return function () {
		var nodeId = index++;

		return {
			/**
			 * Execute all handlers attached to the given event.
			 *
			 * @method emit
			 * @param {String} event The event to emit
			 * @param {Object} [data=undefined] Parameters to pass along to the event handler.
			 * @param {Function} [func=undefined] A function to execute when all event handlers has returned.
			 * @return {Object} `this` with 'config' method.
			 * @example
			 * 	$.emit('something');
			 * 	$.emit('something', { foo: 'bar' });
			 * 	$.emit('something', { foo: 'bar' }, function (data, subscribers) {
			 * 		console.log('Emit done, a total of ' + subscribers + ' subscribers returned: ', data);
			 * 	});
			 */
			emit: function (name, data) {
				return emit({
					name: name,
					data: data,
					from: this
				});
			},

			/**
			 * Attach an event handler function for an event.
			 *
			 * @method on
			 * @param {String} event The event to subscribe to.
			 * @param {Function} handler A function to execute when the event is triggered.
			 * @return {Object} `this`
			 * @example
			 * 	$.on('something', function (data) {
			 * 		console.log('Got something!', data);
			 * 	});
			 */
			on: function (event, handler) {
				on(nodeId, event, handler);
				return this;
			},

			/**
			 * Attach an event handler function for an event which will only be fired once.
			 *
			 * @method once
			 * @param {String} event The event to subscribe to.
			 * @param {Function} handler A function to execute when the event is triggered.
			 * @return {Object} `this`
			 * @example
			 * 	$.once('something', function (data) {
			 * 		console.log('Got something!', data);
			 * 	});
			 */
			once: function (event, handler) {
				on(nodeId, event, function wrapper (data, done) {
					off(nodeId, event, wrapper);
					handler(data, (handler.length > 1) ? done : done());
				}, true);

				return this;
			},

			/**
			 * Removes an event handler function for an event.
			 *
			 * @method off
			 * @param {String} event The event to unsubscribe from.
			 * @param {Function} [handler=null] The original handler that was attached to this event. If not passed, all subscriptions will be removed.
			 * @return {Object} `this`
			 * @example
			 * 	$.off('something');
			 * 	$.off('something else', handler);
			 */
			off: function (event, handler) {
				off(nodeId, event, handler);
				return this;
			},

			/**
			 * Allows for extra configuration on the `emit` command.
			 * The `config` method is only available from the beginning and end of an `emit` call.
			 * During any other time this method is `undefined`.
			 *
			 * @method config
			 * @param {String} event The event to unsubscribe from.
			 * @param {Function} [handler=null] The original handler that was attached to this event. If not passed, all subscriptions will be removed.
			 * @return {Object} `this`
			 * @example
			 * 	$.config({
			 * 		persistent: true,
			 * 		callback: function () {}
			 * 	});
			 */
			config: undef,

			// Only used in testing.
			// Should get removed in production (and will be removed in the minified version)
			destroy: function () {
				nodeId = 0;
				index = 0;
				subs = {};
				emits = {};
				return this;
			}
		};
	};
}())));