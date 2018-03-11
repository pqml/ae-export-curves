// open project.aep with After Effects

const curves = require('../lib/export-curves')
const tc = require('await-handler')

;(async () => {
  const [err, json] = await tc(curves({
    composition: 'Composition',
    precision: 5,
    properties: {
      slider: ['Controller', 'Effects', 'Influence', 'Slider']
    }
  }))

  if (err) console.log(err)
  else console.log(json)
})()