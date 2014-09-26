(function () {
	function start_test (castrato, AMD) {
		var sentinel = { sentinel: 1 },
			sentinel2 = { sentinel: 2 };

		// If required as an AMD module - castrato will immediatly return a new node.
		// Therefore we'll have to wrap the incoming castrato in a dummy function that returns a "new" node. 
		// Not all tests are compatible with as being ran with only one node but the majority is.
		if (AMD) {
			var _castrato = castrato;
			castrato = function () {
				return _castrato;
			};
		}

		/*------------------------------------*\
		    A small and crude assert function
		    that can handle asynchronous tests,
		    timeouts and max/min executions.
		\*------------------------------------*/
		var assert = (function () {
			var queue = [],
				assert_in_progress = false;

			function assert (descr, times, func) {
				assert_in_progress = true;

				var timeoutId,
					mediator = castrato();

				if (!func) {
					func = times;
					times = 1;
				}

				function isOk (ok, extra) {
					console.log('times', times);
					if (times === 0 && --times) {
						ok = 'toomany';
					} else if (!--times) {
						clearTimeout(timeoutId);
						mediator.destroy();
						assert_in_progress = false;
					}

					if (ok === true) {
						if (!times) {
							console.info('[OK]', descr, '\n');
						}
					} else {
						clearTimeout(timeoutId);
						mediator.destroy();

						if (ok === undefined) {
							times && console.warn('[TIMED OUT] (left: ' + times + ')', descr, '\n');
						} else if (ok === 'toomany') {
							console.warn('[TOO MANY]', descr, '\n');
						} else {
							console.warn('[FAILED]', descr, '\n');
						}
					}

					if (times <= 0 && queue.length) {
						var next = queue.shift();
						assert(next[0], next[1], next[2]);
					}
				}

				timeoutId = setTimeout(isOk, 200);
				try { func(isOk); } catch (e) { isOk(false); throw e; }
			}

			return function (descr, times, func) {
				if (!assert_in_progress) {
					assert(descr, times, func);
				} else {
					queue.push([descr, times, func]);
				}
			};
		}());

		/*------------------------------------*\
		    Test cases
		\*------------------------------------*/
		/*
		assert('One emit, one node.', function (isOk) {
			var node = castrato();

			node
				.on('something', function () {
					isOk(true);
				})
				.emit('something');
		});

		assert('One emit, one node. With data.', function (isOk) {
			var node = castrato();

			node
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.emit('something', sentinel);
		});

		assert('Multiple emits, one node.', 3, function (isOk) {
			var node = castrato();

			node
				.on('something', function () {
					isOk(true);
				})
				.emit('something')
				.emit('something')
				.emit('something');
		});

		assert('Multiple emits, one node. With data.', 3, function (isOk) {
			var node = castrato();

			node
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});

		assert('Multiple subscriptions, one node, one emit.', 3, function (isOk) {
			var node = castrato();

			node
				.on('something', function () {
					isOk(true);
				})
				.on('something', function () {
					isOk(true);
				})
				.on('something', function () {
					isOk(true);
				})
				.emit('something');
		});

		assert('Multiple subscriptions, one node, one emit. With data.', 3, function (isOk) {
			var node = castrato();

			node
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.emit('something', sentinel);
		});
		assert('Multiple subscriptions, one node, multiple emits.', 9, function (isOk) {
			var node = castrato();

			node
				.on('something', function () {
					isOk(true);
				})
				.on('something', function () {
					isOk(true);
				})
				.on('something', function () {
					isOk(true);
				})
				.emit('something')
				.emit('something')
				.emit('something');
		});

		assert('Multiple subscriptions, one node, multiple emits. With data.', 9, function (isOk) {
			var node = castrato();

			node
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});

		assert('Multiple nodes, one emit.', 3, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1.on('something', function () {
				isOk(true);
			});

			node2.on('something', function () {
				isOk(true);
			});

			node3.on('something', function () {
				isOk(true);
			});

			node4.emit('something');
		});

		assert('Multiple nodes, one emit. With data.', 3, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1.on('something', function (data) {
				isOk(data === sentinel);
			});

			node2.on('something', function (data) {
				isOk(data === sentinel);
			});

			node3.on('something', function (data) {
				isOk(data === sentinel);
			});

			node4.emit('something', sentinel);
		});

		assert('Multiple nodes, multiple emits.', 9, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1.on('something', function () {
				isOk(true);
			});

			node2.on('something', function () {
				isOk(true);
			});

			node3.on('something', function () {
				isOk(true);
			});

			node4
				.emit('something')
				.emit('something')
				.emit('something');
		});

		assert('Multiple nodes, multiple emits. With data.', 9, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1.on('something', function (data) {
				isOk(data === sentinel);
			});

			node2.on('something', function (data) {
				isOk(data === sentinel);
			});

			node3.on('something', function (data) {
				isOk(data === sentinel);
			});

			node4
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});


		assert('Multiple nodes with multiple subscriptions, multiple emits.', 9, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1.on('something', function () {
				isOk(true);
			});

			node2.on('something', function () {
				isOk(true);
			});

			node3.on('something', function () {
				isOk(true);
			});

			node4
				.emit('something')
				.emit('something')
				.emit('something');
		});

		!AMD && assert('Multiple nodes with multiple subscriptions, multiple emits. With data.', 27, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node2
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node3
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node4
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});

		!AMD && assert('Multiple nodes with multiple subscriptions, multiple emits. One node removes it\'s subscription. With data.', 18, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node2
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node3
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node2.off('something');

			node4
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});

		!AMD && assert('Multiple nodes with multiple subscriptions, multiple emits. One node removes it\'s subscription and then binds them again. With data.', 27, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node2
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node3
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node2
				.off('something')
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				})
				.on('something', function (data) {
					isOk(data === sentinel);
				});

			node4
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});

		assert('Multiple nodes with multiple subscriptions, multiple emits. One of each of the nodes removes 1 EXPLICIT handler. With data.', 18, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato(),

				h1 = function (data) { isOk(data === sentinel); },
				h2 = function (data) { isOk(data === sentinel); },
				h3 = function (data) { isOk(data === sentinel); },
				h4 = function (data) { isOk(data === sentinel); },
				h5 = function (data) { isOk(data === sentinel); },
				h6 = function (data) { isOk(data === sentinel); },
				h7 = function (data) { isOk(data === sentinel); },
				h8 = function (data) { isOk(data === sentinel); },
				h9 = function (data) { isOk(data === sentinel); };

			node1
				.on('something', h1)
				.on('something', h2)
				.on('something', h3);

			node2
				.on('something', h4)
				.on('something', h5)
				.on('something', h6);

			node3
				.on('something', h7)
				.on('something', h8)
				.on('something', h9);

			node1.off('something', h1);
			node2.off('something', h5);
			node3.off('something', h9);

			node4
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});

		assert('Multiple nodes with multiple ASYNCHRONOUS subscriptions, multiple emits. With data.', 27, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 150);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 20);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 45);
				});

			node2
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 110);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 98);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 43);
				});

			node3
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 54);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 100);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done();
						isOk(data === sentinel);
					}, 0);
				});

			node4
				.emit('something', sentinel)
				.emit('something', sentinel)
				.emit('something', sentinel);
		});

		assert('Multiple nodes with multiple ASYNCHRONOUS subscriptions, multiple emits. That take and returns data.', 27, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 50);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 40);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 100);
				});

			node2
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 101);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 107);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 21);
				});

			node3
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 78);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 64);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 7);
				});

			node4
				.emit('something', sentinel).config({
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							isOk(data[i] === sentinel2);
						}
					}
				})
				.emit('something', sentinel).config({
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							isOk(data[i] === sentinel2);
						}
					}
				})
				.emit('something', sentinel).config({
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							isOk(data[i] === sentinel2);
						}
					}
				});
		});

		assert('Multiple nodes with multiple ASYNCHRONOUS subscriptions, multiple emits. That take and returns data. With the `persistent` flag included and set to `false`', 27, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node1
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 50);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 40);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 100);
				});

			node2
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 101);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 107);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 21);
				});

			node3
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 78);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 64);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 0);
				});

			node4
				.emit('something', sentinel).config({
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							isOk(data[i] === sentinel2);
						}
					}
				})
				.emit('something', sentinel).config({
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							isOk(data[i] === sentinel2);
						}
					}
				})
				.emit('something', sentinel).config({
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							isOk(data[i] === sentinel2);
						}
					}
				});
		});
	
		assert('Multiple nodes with multiple ASYNCHRONOUS subscriptions, multiple emits. That take and returns data. The emits are done before any subscriptions and the persistent flag is set to `true`.', 27, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			node4
				.emit('something', sentinel).config({
					persistent: true,
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							//console.log(data[i].id, 'done');
							isOk(data[i].sentinel === sentinel2);
						}
					}
				})
				.emit('something', sentinel).config({
					persistent: true,
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							//console.log(data[i].id, 'done');
							isOk(data[i].sentinel === sentinel2);
						}
					}
				})
				.emit('something', sentinel).config({
					persistent: true,
					callback: function (data, subscribers) {
						for (var i = 0; i < subscribers; i++) {
							//console.log(data[i].id, 'done');
							isOk(data[i].sentinel === sentinel2);
						}
					}
				});

			node1
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node1-1'});
					}, 50);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node1-2'});
					}, 40);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node1-3'});
					}, 100);
				});

			node2
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node2-1'});
					}, 101);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node2-2'});
					}, 107);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node2-3'});
					}, 21);
				});

			node3
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node3-1'});
					}, 78);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node3-2'});
					}, 64);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done({sentinel: sentinel2, id: 'node3-3'});
					}, 0);
				});
		});
	*/
		assert('Multiple nodes with multiple ASYNCHRONOUS subscriptions, multiple emits. That take and returns data. The emits are done before any subscriptions and the persistent flag is set to `true`.\n' +
			'One of each node makes three subscriptions, one of which is "on" and the other two "once"`s.', 156, function (isOk) {
			var node1 = castrato(),
				node2 = castrato(),
				node3 = castrato(),
				node4 = castrato();

			for (var i = 0, to = 50; i < 50; i++) {
				node4
					.emit('something', sentinel).config({
						persistent: true,
						callback: function (data, subscribers) {
							for (var i = 0; i < subscribers; i++) {
								isOk(data[i] === sentinel2);
							}
						}
					});
			}

			node1
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 40);
				})
				.once('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 50);
				})
				.once('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 40);
				});

			node2
				.once('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 101);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 40);
				})
				.once('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 107);
				});

			node3
				.once('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 78);
				})
				.once('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 64);
				})
				.on('something', function (data, done) {
					setTimeout(function() {
						done(sentinel2);
					}, 40);
				});
		});
	}

	if (typeof castrato !== 'undefined') {
		start_test(castrato); // Browser
	} else if (typeof require === 'function') {
		if (typeof module !== 'undefined' && module.exports) { // Node
			if ((castrato = require('../source/castrato.js'))) {
				start_test(castrato);
			}
		} else { // AMD
			require(['../source/castrato.js'], function (castrato) {
				start_test(castrato, true);
			});
		}
	}
}());