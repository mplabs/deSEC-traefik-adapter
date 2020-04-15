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

function getInfix(domainName, fqdn) {
  // *.foo.mplabs.cloud => .foo
  // *.mplabs.cloud =>
  // foo.mplabs.cloud => .foo
  return fqdn
    .replace('_acme-challenge.', '')
    .replace(domainName, '')
    .replace(/(.*)\.$/, '.$1')
    .replace(/\.\*/, '')
    .replace(/\.$/, '')
}

module.exports = {
  ash,
  get,
  getInfix,
}
