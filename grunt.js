/**
 * @param {Object} grunt build system.
 */
module.exports = function(grunt) {

  grunt.initConfig({
    lint: {
      files: [
        'grunt.js',
        'src/*.js',
        'test/*.js'
      ]
    },
    concat: {
      core: {
        src: [
          'src/init.coffee',
          'src/util.coffee',
          'src/trampoline.coffee',
          'src/mixins.coffee'
        ],
        dest: '_temp/pp-core.coffee'
      },
      promise: {
        src: [
          'src/promise.coffee',
          'src/generator.coffee'
        ],
        dest: '_temp/pp-promise.coffee'
      },
      collection: {
        src: [
          'src/each.coffee',
          'src/map.coffee',
          'src/fold.coffee',
          'src/filter.coffee',
          'src/any.coffee',
          'src/whilist.coffee',
          'src/task.coffee',
          'src/waterfall.coffee'
        ],
        dest: '_temp/pp-collection.coffee'
      },
      full: {
        src: [
          '_temp/pp-core.coffee',
          '_temp/pp-promise.coffee',
          '_temp/pp-collection.coffee'
        ],
        dest: '_temp/pp.coffee'
      }
    },
    coffee: {
      'pp': {
        dest: 'lib',
        src: ['_temp/pp.coffee'],
        options: {
          bare: false
        }
      }
    },
    min: {
      dist: {
        src: ['lib/pp.js'],
        dest: 'dist/pp.min.js'
      }
    },
    buster: {
      test: {
        config: 'test/buster.js'
      }
    },
    watch: {
      files: [
        'grunt.js',
        'test/*.js',
        'test/*.coffee',
        'src/*.coffee'
      ],
      tasks: 'concat coffee lint min buster'
    }
  });

  grunt.registerTask('default', 'concat coffee lint min buster');
  grunt.loadNpmTasks('grunt-coffee');
  grunt.loadNpmTasks('grunt-buster');
};
