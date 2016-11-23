'use strict';

const gulp = require('gulp');
const del = require('del');
const shell = require('gulp-shell');
const args = require('yargs').argv;

const paths = {
  root: './',
  src: './src/',
  dist: './dist/',
  coverage: './coverage/'
};

class Tasks {
  
  static clean() {
    return del([paths.dist + '*', paths.coverage]);
  }

  static get buildSrc() {
    // Just run the tsc via command line...   
    return shell.task('tsc');
  }

  static get test() {
    return shell.task(`nyc --color --reporter=text --reporter=lcov -a ava -v`);
  }

  static watch() {
    return gulp.watch([paths.src + '**/*'], ['test']);
  }

  static bump(step) {
    return shell.task(`npm version ${step} -m "${(args.m || 'Bump to %s.')}"`);
  }

  static help() {
    console.log(`
Everything you need to know:

     clean - Deletes all generated files.
   * build - Builds all source files. (default)
      test - Runs the test suite and updates coverage.
     watch - Runs tests upon source changes.
bump:major - Upgrades the package's major version.
bump:minor - Upgrades the package's minor version.
bump:patch - Upgrades the package's patch version.
`);
  }
}

// Drop the dist folder...
gulp.task('clean', Tasks.clean);

// Build with cleaning...
gulp.task('build', ['clean'], Tasks.buildSrc);

// Run the basic `npm test` command after a quick build...
gulp.task('test', ['build'], Tasks.test);

// Used for better development (watch with TAP output) (but also because we now are moving more files around)
gulp.task('watch', ['build'], Tasks.watch);

// Set up the git version helpers...
['patch', 'minor', 'major'].forEach(step => {
  gulp.task('bump:' + step, Tasks.bump(step));
});

// Prints a simple command breakdown message.
gulp.task('help', Tasks.help);

// Default task...
gulp.task('default', ['build']);