const crypto = require('crypto')

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

const digest = (value) =>
  crypto.createHash('sha256').update(String(value)).digest()

// Hashing first keeps the buffers equal-length, which timingSafeEqual requires.
const safeEqual = (a, b) => crypto.timingSafeEqual(digest(a), digest(b))

/**
 * Opt-in HTTP basic auth, matching Traefik's HTTPREQ_USERNAME/HTTPREQ_PASSWORD.
 *
 * With no credentials configured this is a pass-through, so existing
 * deployments on a private network keep working untouched.
 */
function basicAuth({ user, password }) {
  if (!user || !password) {
    return (req, res, next) => next()
  }

  return (req, res, next) => {
    const [scheme, encoded] = String(req.headers.authorization || '').split(' ')
    const decoded = Buffer.from(encoded || '', 'base64').toString()
    const separator = decoded.indexOf(':')

    // A userid may not contain a colon, a password may, so split on the first.
    if (
      String(scheme).toLowerCase() !== 'basic' ||
      separator < 0 ||
      !safeEqual(decoded.slice(0, separator), user) ||
      !safeEqual(decoded.slice(separator + 1), password)
    ) {
      res.set('WWW-Authenticate', 'Basic realm="desec-adapter"').sendStatus(401)
      return
    }

    next()
  }
}

module.exports = {
  ash,
  basicAuth,
  get,
  splitFqdn,
}
