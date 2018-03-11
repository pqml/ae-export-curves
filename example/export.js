// open project.aep with After Effects

const curves = require('../lib/export-curves')
const fs = require('fs')
const path = require('path')

const FILEPATH = path.join(__dirname, 'data.json')

curves({
    composition: 'Comp 1',
    precision: 5,
    properties: {
      translateX: ['Shape Layer 1', 'Transform', 'X Position'],
      scaleX: ['Shape Layer 1', 'Transform', 'Scale', 0],
      rotation: ['Shape Layer 1', 'Transform', 'Rotation']
    }
})
  .then(json => { console.log(json); return json })
  .then(json => fs.writeFileSync(FILEPATH, JSON.stringify(json, null, 2)))
  .catch(err => console.log(err))
