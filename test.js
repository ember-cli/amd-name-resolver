'use strict';

var expect = require('chai').expect;
var path = require('path');
var amd = require('./index');
var moduleResolve = amd.moduleResolve;
var resolveModules = amd.resolveModules;
var ParallelApi = require('broccoli-babel-transpiler/lib/parallel-api');

describe('module resolver', function() {
  it('should resolve relative sibling', function() {
    expect(moduleResolve('./foo', 'example/bar')).to.eql('example/foo');
  });

  it('should resolve relative parent', function() {
    expect(moduleResolve('../foo', 'example/bar/baz')).to.eql('example/foo');
  });

  it('should be a pass through if absolute', function() {
    expect(moduleResolve('foo/bar', 'example/')).to.eql('foo/bar');
  });

  it('should throw parent module of root is accesed', function() {
    expect(function() {
      return moduleResolve('../../bizz', 'example');
    }).to.throw(/Cannot access parent module of root/);
  });

  it('should not throw if specified', function() {
    expect(function() {
      var resolver = resolveModules({ throwOnRootAccess: false });
      return resolver('../../bizz', 'example');
    }).to.not.throw(/Cannot access parent module of root/);
  });
});

describe('parallel babel transpilation', function() {
  var resolver;
  var options;

  beforeEach(function() {
    options = { foo: 'bar', moduleRoot: 'baz' };
    resolver = resolveModules(options);
  });

  it('is setup correctly', function() {
    expect(typeof resolver._parallelBabel).to.eql('object');
    expect(resolver._parallelBabel.requireFile).to.eql(path.join(__dirname, 'index.js'));
    expect(resolver._parallelBabel.buildUsing).to.eql('resolveModules');
    expect(resolver._parallelBabel.params).to.deep.eql(options);
  });

  it('builds', function() {
    expect(ParallelApi.buildFromParallelApiInfo(resolver._parallelBabel).toString())
      .to.eql(resolver.toString());
  });

  it('serializes and deserializes', function() {
    var babelOptions = { resolveModuleSource: resolver };
    var serializedOptions = ParallelApi.serializeOptions(babelOptions);
    expect(ParallelApi.deserializeOptions(serializedOptions).toString()).to.eql(babelOptions.toString());
  });

  it('follows the parallel API', function() {
    expect(ParallelApi.transformIsParallelizable({ resolveModuleSource: moduleResolve})).to.be.ok;
  });

  it('isolates options to each instance', function() {
    expect(resolver._parallelBabel.params).to.not.eql(moduleResolve._parallelBabel.params);
  });
});
