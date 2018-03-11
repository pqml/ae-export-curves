<h1 align="center">ae-export-curves</h1>
<h3 align="center">Export After Effects curves as JSON</h3>

<br><br><br>

## Features
- Create small json objects containing curves infos from After Effect properties
- Supports bezier / hold / linear keyframe types
- Easily read these curves client-side with [ae-read-curves](https://github.com/pqml/ae-read-curves)
- :warning: **Doesn't support color property type & spatial properties like position / curve path**

<br><br>

## Requirements
- Node >= 8
- After Effects **in English**
- only tested with CC 2018, but may works with previous versions

<br><br>

## Example
```js
const curves = require('ae-export-curves')

// The function will read the current opened project
// and exports chosen property curves
curves({
    // Choose the composition you want to export
    composition: 'Comp 1',
    // You can set a decimal precision
    precision: 5,
    properties: {
      // First item of the array is the layer you want to access to
      // then, just chain sub-properties until you reach the one you want to export
      rotation: ['Shape Layer 1', 'Transform', 'Rotation'],

      // Position is a spatial property. This is not support right now but you can
      // split dimensions in After Effects and use X Position / Y Position
      translateX: ['Shape Layer 1', 'Transform', 'X Position'],

      // For multi-dimensional properties, you must specify which dimension
      // you want to collect by specify an index at last item of the array
      scaleX: ['Shape Layer 1', 'Transform', 'Scale', 0],
    }
})
  .then(json => console.log(json))
  .catch(err => console.log(err))
```
