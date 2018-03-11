<h1 align="center">ae-export-curves</h1>
<h3 align="center">Read After Effects curves exported by ae-export-curves</h3>

<br><br><br>

## Features
- Create small json objects containing curves infos from After Effect properties
- Supports bezier / hold / linear keyframe types
- Easily read these curves client-side with [https://github.com/pqml/ae-read-curves](ae-read-curves)
- :warning: **Only works for numerical, one-dimensional properties**

<br><br>

## Requirements
- Node >= 8
- After Effects **in English**
- only tested with CC 2018, but may works with previous versions

<br><br>

## Example
```
const curves = require('ae-export-curves')

curves({
   composition: 'Composition',
   precision: 5,
   properties: {
     slider: ['LayerA', 'Effects', 'Influence', 'Slider']
   }
})
  .then(json => console.log(json))
  .catch(err => console.log(err))
```