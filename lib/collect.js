const KF_TYPES = {
  HOLD: 0,
  LINEAR: 1,
  BEZIER: 2
}

const ERRORS = {
  noCompName: () => 'You must specify a composition.',
  noItems: () => 'No items in the current AE Project.',
  compNotFound: (name) => `Composition ${name} not found in the current AE Project.`,
  badPropFormatting: () => 'Properties have to be arrays.',
  layerNotFound: (name) => `Layer ${name} not found.`,
  propNotFound: (prop, layer) => `Property ${prop} not found in layer ${layer}.`,
  kfNotFound: (prop) => `Keyframes not found in ${prop}. You may need to select a sub-property.`
}

// from lodash
function round (number, precision) {
  let pair = (number + 'e').split('e')
  const value = Math.round(pair[0] + 'e' + (+pair[1] + precision))
  pair = (value + 'e').split('e')
  return +(pair[0] + 'e' + (+pair[1] - precision))
}

function getBezierData (current, next, precision) {
  const v0 = current[1]
  const v1 = next[1]
  const duration = next[0] - current[0]
  const averageSpeed = (v1 - v0) / duration
  const x0 = current[2].easeOut.temporalEase[0].influence / 100
  const y0 = current[2].easeOut.temporalEase[0].speed / averageSpeed * x0
  const x1 = 1 - next[2].easeIn.temporalEase[0].influence / 100
  const y1 = 1 - next[2].easeIn.temporalEase[0].speed / averageSpeed * (1 - x1)
  return [x0, y0, x1, y1].map(v => round(v, precision))
}

function getCurveData (keyframes, duration, precision) {
  const out = []
  keyframes.forEach((current, i) => {
    const next = keyframes[i + 1]
    const data = []
    out.push(data)
    data.push(round(current[0] / duration, precision))
    data.push(round(current[1], precision))

    if (current[2].easeOut.type === 'hold' || !next) {
      data.push(KF_TYPES.HOLD)
    } else if (current[2].easeOut.type === 'linear' && next[2].easeIn.type === 'linear') {
      data.push(KF_TYPES.LINEAR)
    } else {
      data.push(KF_TYPES.BEZIER)
      data.push(getBezierData(current, next, precision))
    }
  })
  return out
}

module.exports = function (data, config = {}) {
  const compName = config.composition
  if (!compName) throw new Error (ERRORS.noCompName())

  const precision = config.precision !== undefined ? (config.precision | 0) : 5
  const props = config.properties || []
  const out = {}

  if(!data || !data.project || !data.project.items) throw new Error (ERRORS.noItems())

  const comp = data.project.items.filter(i => i.name === compName && i.typeName === 'Composition')[0]

  if (!comp) throw new Error (ERRORS.compNotFound(compName))

  out.d = round(comp.duration, precision)
  out.h = round(comp.height, precision)
  out.w = round(comp.width, precision)
  out.k = {}

  for (let propName in props) {
    if (!Array.isArray(props[propName])) throw new Error (ERRORS.badPropFormatting())
    const keys = props[propName].slice(0)
    if (!keys[0]) return
    const layerName = keys.shift()
    const layer = comp.layers.filter(layer => layer.name === layerName)[0]
    if (!layer) throw new Error (ERRORS.layerNotFound(layerName))

    let prop = layer.properties
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      prop = prop[k]
      if (!prop) throw new Error (ERRORS.propNotFound(keys.join(' > '), layerName))
    }

    const keyframes = prop.keyframes
    if (!keyframes) throw new Error (ERRORS.kfNotFound([layerName].concat(keys).join(' > ')))

    out.k[propName] = getCurveData(keyframes, comp.duration, precision)
  }

  return out
}
