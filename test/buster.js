var config = module.exports;

config['Test Suites'] = {
  rootPath: '../',
  environment: 'node',
  libs: ['lib/pp.js'],
  tests: ['test/**/*-test.coffee'],
  extensions: [require('buster-coffee')]
};

/*
config['Browser Tests'] = {
  extends: 'Test Suites',
  environment: 'browser',
  sources: ['lib/pp.js']
};

config['Node Test'] = {
  extends: 'Test Suites',
  environment: 'node'
};
*/
