const ash = (fn) => (...args) => {
  const ret = fn(...args)
  const next = args[args.length-1]
  return Promise.resolve(ret).catch(next)
}

function get(object, path, value) {
  // If path is not defined or it has false value
  if (!path) {
    return undefined
  }
  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets
  const pathArray = Array.isArray(path)
    ? path
    : path.split(/[,[\].]/g).filter(Boolean)
  // Find value if exist return otherwise return undefined value
  return (
    pathArray.reduce((prevObj, key) => prevObj && prevObj[key], object) || value
  )
}

/**
 * Pick the deSEC zone that owns this fqdn and split off the rrset subname.
 * Longest match wins, so a deeper zone beats its parent.
 *
 * ('_acme-challenge.s3.mplabs.cloud.', ['mplabs.cloud'])
 *   => { domain: 'mplabs.cloud', subdomain: '_acme-challenge.s3' }
 *
 * @param {string} fqdn
 * @param {string[]} zoneNames names of the zones the token owns
 */
function splitFqdn(fqdn, zoneNames) {
  const name = String(fqdn).replace(/\*\./g, '').replace(/\.$/, '').toLowerCase()
  const zone = zoneNames
    .map((z) => z.replace(/\.$/, '').toLowerCase())
    .filter((z) => name.endsWith(`.${z}`))
    .sort((a, b) => b.length - a.length)[0]

  if (!zone) {
    throw new Error(`No deSEC zone owns fqdn '${fqdn}'`)
  }

  return { domain: zone, subdomain: name.slice(0, -(zone.length + 1)) }
}

module.exports = {
  ash,
  get,
  splitFqdn,
}
