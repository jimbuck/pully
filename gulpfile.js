var gulp = require('gulp');
var exec = require('child_process').exec;
var connect = require('gulp-connect');

var paths = {
  all: './*',
  root: './',
  index: './index.js',
  lib: './lib/**/*.*',
  data: './data/**/*.*',
  spec: './spec/**/*.*',
  coverage: './coverage/**/*.*',
  coverageReport:'./coverage/lcov-report'
};

gulp.task('default', ['dev']);

gulp.task('lint', execTask('eslint -c ./.eslintrc ./'));

gulp.task('lint:fix', execTask('eslint -c ./.eslintrc --fix ./'));

gulp.task('test', ['lint:fix'], execTask('istanbul cover -x \"*.spec.js\" --print detail ./node_modules/jasmine-node/bin/jasmine-node spec'));

gulp.task('test:all', ['lint'], execTask('istanbul cover --print detail ./node_modules/jasmine-node/bin/jasmine-node spec'));

gulp.task('test:ci', ['test'], execTask('codeclimate-test-reporter < ./coverage/lcov.info'));

gulp.task('coverage-server', function() {
  connect.server({
    root: paths.coverageReport,
    livereload: true
  });
});

gulp.task('refresh', ['test:all'], function () {
  try {
    gulp.src(__filename)
    .pipe(connect.reload());
  } catch (e) {
    console.log(e);
  }
});

gulp.task('dev', ['coverage-server'], function () {
  gulp.watch([paths.index, paths.lib, paths.spec, paths.data], ['refresh']);
});

function execTask(command) {
  return function (cb) {
    exec(command, function (err, stdout, stderr) {
      if (stdout) {
        console.log(stdout);
      }

      if (stderr) {
        console.log(stderr);
      }

      cb(err);
    });
  };
}