castrato.js
-------------------------------------------------------------------------------------------------------------

An extremely **small** (< 1kb minified / < 0.5kb gzipped) and **fast** Javascript mediator working as global, AMD module and in Node.

**Main features:**

1. Feature 1
2. Feature 2
2. Feature 3

## Getting started ##

### Browsers ###
In the case when castrato cannot find an AMD loader or exports object; castrato will attach itself to the current context (presumably `window`).

```
<script type="text/javascript" src="castrato.js"></script>

// Create two messaging nodes
var node1 = castrato(),
    node2 = castrato();

// Attach event handlers 
node1
    .on('something', function (data) {
        console.log('Got something!');
    })
    .on('something else', function (data) {
        console.log('Got something else!');
    });

// Emit
node2.emit('something', { foo: 'bar' });
```

### AMD ###
When required as an AMD module - castrato assumes that only one messaging node is required and returns one immediatly.

```
require(['castrato'], function (myNode) {
    myNode.on('something', function (data) {
        console.log('Got something!');
    });
});
```

### Node ###
Description

```
Code
```

## Documentation ##
Documentation description

###on###
Description

```
Code
```

###off###
Description

```
Code
```

###emit###
Description

```
Code
```

###Persistent emits###
Description

```
Code
```

###Emitting with callback###
Description

```
Code
```
