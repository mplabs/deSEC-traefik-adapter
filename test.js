const glob = require('glob')

const filesPattern = process.argv[2]
const tests = []

global.it = (name, fn) => {
  tests.push({ name, fn })
}

glob(filesPattern, { absolute: true}, (err, files) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  
  files.forEach(file => {
    // Require all specs, they will in turn call it()
    require(file)
  })

  tests.forEach(({ name, fn }) => {
    try {
      fn()
      console.log('✅', name)
    } catch (e) {
      console.log('❌', name)
      console.log(e.stack)
    }
  })
})
