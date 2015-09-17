/**
 * Created by khalilbrown on 9/14/15.
 */
//var app = require('../../app');
var expect  = require("chai").expect;
var assert  = require("chai").assert;
var request = require("request");
var should  = require("should");

describe("Routes",function(){
    var url = "http://localhost:3002";
    var options = {
        headers:{
            'Authorization':''
        }
    };
    it("returns status 200",function(done){
        request(url+'/categories',function(err,response,body){
            console.log(response.statusCode)
            response.statusCode.should.equal(200);
//            expect(response.statusMessage).to.be.an('object')
//            expect(response.statusMessage).to.eql('Unauthorize');
//            assert.equal(response.statusCode,200,'correct stat code')
            done();
        })
    });
})