var gulp = require('gulp');
var exec = require('child_process').exec;
var connect = require('gulp-connect');
var open = require('gulp-open');

// Setup the paths for the various folders/files.
var paths = {
  all: './*',
  root: './',
  index: './index.js',
  lib: './lib/**/*.*',
  data: './data/**/*.*',
  spec: './spec/**/*.*',
  coverage: './coverage/**/*.*',
  coverageReport: './coverage/lcov-report'
};

// Set the default task to the dev task.
gulp.task('default', ['dev']);

// Runs the ESLinter with reporting only.
gulp.task('lint', execTask('eslint -c ./.eslintrc ./'));

// Runs the ESLinter with reporting and auto fix.
gulp.task('lint:fix', execTask('eslint -c ./.eslintrc --fix ./'));

// ESLints the code, autofixes and runs the tests and gathers code coverage on source files (used on demand).
gulp.task('test', ['lint'], execTask('istanbul cover -x \"*.spec.js\" --print detail ./node_modules/jasmine-node/bin/jasmine-node spec'));

// ESLints the code and runs the tests and gathers code coverage on all files (used during development).
gulp.task('test:all', ['lint'], execTask('istanbul cover --print detail ./node_modules/jasmine-node/bin/jasmine-node spec'));

// ESLints the code, runs the tests, and reports the coverage results to codeclimate.com
gulp.task('test:ci', ['test'], execTask('codeclimate-test-reporter < ./coverage/lcov.info'));

// Starts a webserver for the code coverage report.
gulp.task('coverage-server', function () {
  connect.server({
    root: paths.coverageReport,
    livereload: true
  });
  
  gulp.src(__filename)
    .pipe(open({ uri: 'http://localhost:8080' }));
});

// Re-runs all the tests and live-reloads the webserver.
gulp.task('refresh', ['test:all'], function () {
  try {
    gulp.src(__filename)
      .pipe(connect.reload());
  }
  catch (e) {
    console.log(e);
  }
});

// Starts the coverage server and then watches for changes
gulp.task('dev', ['coverage-server', 'test:all'], function () {
  gulp.watch([paths.index, paths.lib, paths.spec, paths.data], ['refresh']);
});

// Creates a gulp task that runs a command and outputs the results, passing the error into the gulp callback.
function execTask(command) {
  return function (cb) {
    exec(command, function (err, stdout, stderr) {
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.log(stderr);
      }
      cb();
    });
  };
}
