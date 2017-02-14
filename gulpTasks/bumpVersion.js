const path = require('path')

const gulp = require('gulp')
const exeq = require('exeq')
const moment = require('moment')
const Promise = require('bluebird')
const fsExtra = Promise.promisifyAll(require('fs-extra'))
const basePath = path.resolve(__dirname, '..')

const extManifestFilePath = path.join(basePath, 'src', 'manifest.json')

const newVersionString = `${ moment().year() }.${ moment().month() + 1 }.${ moment().date() }`

gulp.task('bumpVersion', () => {
  /*****
  * Update the npm package.json version and the extension manifest version.
  */
  console.log(`bumping version in npm package.json and in extension manifest'`)
  exeq(`npm --no-git-tag-version --force version ${ newVersionString }`)
    .then(() => fsExtra.readJsonAsync(extManifestFilePath))
    .then(exManifestObj =>
      fsExtra.writeJsonAsync(
        extManifestFilePath,
        Object.assign({}, exManifestObj, {version: newVersionString})
      )
    )
    .catch(function(err) {
      console.error('There was an error running bumpVersion', err)
    })
})
