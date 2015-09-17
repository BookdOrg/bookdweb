/**
 * Created by khalilbrown on 9/14/15.
 */
//var app = require('../../app');
var expect  = require("chai").expect;
var assert  = require("chai").assert;
var request = require("supertest");
var should  = require("should");

describe("Routes",function(){
    var url = "http://localhost:3002";
    var token = null;

    before(function(done){
        request(url)
            .post('/login')
            .send({username:'testaccount',password:'1234'})
            .end(function(err,res){
                token = res.body.token;
                done();
            });
    });
    it("/Login returns status 200",function(done){
        request(url)
            .post('/login')
            .send({username:'testaccount',password:'1234'})
            .expect(200,done)
    })
    it("/categories returns status 200",function(done){
        request(url)
            .get('/categories')
            .set('Authorization','Bearer '+token)
            .expect(200,done)
    });
    it("/categories returns a list of categories",function(done){
        request(url)
            .get('/categories')
            .set('Authorization','Bearer '+token)
            .end(function(err,result){
                expect(result.body).not.to.be.null;
                expect(result.body).to.be.an('array');
                expect(result.body[0]).to.have.property('_id')
                expect(result.body[0]).to.have.property('id')
                expect(result.body[0]).to.have.property('image')
                expect(result.body[0]).to.have.property('title')
                done();
            })
    })
})

//        request(url+'/categories',function(err,response,body){
//            response.statusCode.should.equal(200);
////            expect(response.statusMessage).to.be.an('object')
////            expect(response.statusMessage).to.eql('Unauthorize');
////            assert.equal(response.statusCode,200,'correct stat code')