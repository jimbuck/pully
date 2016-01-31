var gulp = require('gulp');
var exec = require('child_process').exec;

// Set the default task to the dev task.
gulp.task('default', ['test']);

// Runs the ESLinter with reporting only.
gulp.task('lint', execTask('eslint -c ./.eslintrc ./'));

// Runs the ESLinter with reporting and auto fix.
gulp.task('lint:fix', execTask('eslint -c ./.eslintrc --fix ./'));

// ESLints the code, autofixes and runs the tests and gathers code coverage on source files (used on demand).
gulp.task('test', ['lint'], execTask('jasmine-node spec'));

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
