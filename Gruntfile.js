module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jasmine: {
      all: {
        src: 'spongelog.js',
        options: {
          specs: 'spec/spongelog_spec.js'
        }
      }
    },

    jshint: {
      options: {
        curly: false,
        camelcase: true,
        eqeqeq: true,
        browser: true,
        indent: 2,
        newcap: true,
        undef: true,
        unused: true,
        trailing: true,
        sub: true,
        maxlen: 80
      },
      files: {
        src: ['**/*.js']
      }
    },

  });
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
};
