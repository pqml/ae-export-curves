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
  kfNotFound: (prop) => `Keyframes not found in ${prop}. You may need to select a sub-property.`,
  unsupportedType: (prop, layer, type) => `Unsupported type (${type}) for property ${prop} in layer ${layer}.`,
  needIndex: (prop, type) => `${prop} is multi-dimensional (${type}), you must specify an index.`
}

const forceArray = val => Array.isArray(val) ? val : [val]

// from lodash
function round (number, precision) {
  let pair = (number + 'e').split('e')
  const value = Math.round(pair[0] + 'e' + (+pair[1] + precision))
  pair = (value + 'e').split('e')
  return +(pair[0] + 'e' + (+pair[1] - precision))
}

function getBezierData (current, next, precision, dim = 0) {
  const v0 = forceArray(current[1])[dim]
  const v1 = forceArray(next[1])[dim]
  const duration = next[0] - current[0]
  const averageSpeed = (v1 - v0) / duration
  const x0 = current[2].easeOut.temporalEase[dim].influence / 100
  const y0 = current[2].easeOut.temporalEase[dim].speed / averageSpeed * x0
  const x1 = 1 - next[2].easeIn.temporalEase[dim].influence / 100
  const y1 = 1 - next[2].easeIn.temporalEase[dim].speed / averageSpeed * (1 - x1)
  return [x0, y0, x1, y1].map(v => round(v, precision))
}

function getCurveData (keyframes, duration, precision, dim = 0) {
  const out = []
  keyframes.forEach((current, i) => {
    const next = keyframes[i + 1]
    const data = []
    out.push(data)
    data.push(round(current[0] / duration, precision))
    data.push(round(forceArray(current[1])[dim], precision))

    if (current[2].easeOut.type === 'hold' || !next) {
      data.push(KF_TYPES.HOLD)
    } else if (current[2].easeOut.type === 'linear' && next[2].easeIn.type === 'linear') {
      data.push(KF_TYPES.LINEAR)
    } else {
      data.push(KF_TYPES.BEZIER)
      data.push(getBezierData(current, next, precision, dim))
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

  // get composition data
  const comp = data.project.items.filter(i => i.name === compName && i.typeName === 'Composition')[0]
  if (!comp) throw new Error (ERRORS.compNotFound(compName))

  // collect composition data (resolution / width)
  out.d = round(comp.duration, precision)
  out.h = round(comp.height, precision)
  out.w = round(comp.width, precision)
  out.k = {}

  // handle properties
  for (let propName in props) {
    if (!Array.isArray(props[propName])) throw new Error (ERRORS.badPropFormatting())
    const keys = props[propName].slice(0)
    if (!keys[0]) return
    // extract layer name
    const layerName = keys.shift()
    // get layer data and its properties
    const layer = comp.layers.filter(layer => layer.name === layerName)[0]
    if (!layer) throw new Error (ERRORS.layerNotFound(layerName))
    let prop = layer.properties

    // extract index for multidimensional properties
    let multidimIndex = 0
    const lastKey = keys[keys.length - 1]
    if (lastKey === 0 || lastKey === 1 || lastKey === 2) {
      multidimIndex = keys.pop()
    }

    // search for the property in the layer
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      prop = prop[k]
      if (!prop) throw new Error (ERRORS.propNotFound(keys.join(' > '), layerName))
    }

    const propType = prop.propertyValueType

    // no keyframes
    const keyframes = prop.keyframes
    if (!keyframes) throw new Error (ERRORS.kfNotFound([layerName].concat(keys).join(' > ')))

    // unsupported type
    if (propType === 'TwoD_SPATIAL' || propType === 'ThreeD_SPATIAL' || propType === 'COLOR') {
      throw new Error (ERRORS.unsupportedType(keys.join(' > '), layerName, propType))
    }

    // multidimensional without index
    if ((propType === 'TwoD' || propType === 'ThreeD') && multidimIndex === null) {
      throw new Error (ERRORS.needIndex([layerName].concat(keys).join(' > '), propType))
    }

    out.k[propName] = getCurveData(keyframes, comp.duration, precision, multidimIndex)
  }

  return out
}
