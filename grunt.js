/**
 * @param {Object} grunt .
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
      dist: {
        src: [
          'src/init.coffee',
          'src/util.coffee',
          'src/context.coffee',
          'src/trampoline.coffee',
          'src/promise.coffee',
          'src/generator.coffee',
          'src/mixins.coffee',
          'src/each.coffee',
          'src/map.coffee',
          'src/fold.coffee',
          'src/filter.coffee',
          'src/any.coffee',
          'src/whilist.coffee',
          'src/task.coffee',
          'src/waterfall.coffee'
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
    buster: {
      test: {
        config: './test/buster.js'
      }
    },
    watch: {
      files: [
        'grunt.js',
        'test/*.js',
        'test/*.coffee',
        'src/*.coffee'
      ],
      tasks: 'concat coffee lint buster'
    }
  });

  grunt.registerTask('default', 'concat coffee lint buster');
  grunt.loadNpmTasks('grunt-coffee');
  grunt.loadNpmTasks('grunt-buster');
};

