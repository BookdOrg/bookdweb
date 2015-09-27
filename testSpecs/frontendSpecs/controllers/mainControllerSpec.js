/**
 * Created by khalilbrown on 9/17/15.
 */

//var expect  = require("chai").expect;
//var assert  = require("chai").assert;
//var request = require("supertest");
//var should  = require("should");

describe('Array', function(){
    describe('#indexOf()', function(){
        it('should return -1 when the value is not present', function(){
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        })
    })
})

describe('MainCtrl', function(){
    beforeEach(module('cc'));
    describe('search()', function(){
        it('should return businesses', inject(function($controller,businessFactory){
            var scope = {};
            var myController = $controller('MainCtrl', {
                $scope: scope
            });
            scope.query = {};
            scope.query.term = 'Chief';
            scope.query.location = "Piscataway";
            scope.name = "Khalil"
            scope.name.should.be.a('string');

        }));
    });
});