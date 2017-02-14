
const path = require('path')

const gulp = require('gulp')
const z = require('bauer-zip')

const basePath = path.resolve(__dirname, '..')

const folderToZip = path.join(basePath, 'ChromeBuild')


gulp.task('zipBuild', () => {
  z.zip(folderToZip, path.join(basePath, 'ChromeBuild.zip'))
})
