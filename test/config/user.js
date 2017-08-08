'use strict';

const Lab = require('lab');
const Code = require('code');
const Fixtures = require('../fixtures');
const { db, Server } = Fixtures;
const Nock = require('nock');
const Config = require('getconfig');
const Base32 = require('base32-crockford-browser');

const lab = exports.lab = Lab.script();

const { describe, it, before, after, afterEach } = lab
const { expect } = Code;

describe('POST /config/user', () => {
  let server;

  before(async() => {

    server = await Server;
  });

  it('Should return proper data for user route and log it ', () => {

    const iceServers = Fixtures.iceServers();
    const user = Fixtures.user();
    const token = Fixtures.token(user);

    Nock(Config.talky.ice.servers[0])
      .get('/ice-servers.json')
      .reply(200, iceServers);

    let userId;

    return server.inject({ method: 'POST', url: '/config/user', payload: { token } })
      .then((res) => {
        expect(res.statusCode).to.equal(200);
        return res.result;
      }).then((result) => {

        const sessionId = result.sessionId;
        userId = result.userId;
        const decodedUserId = JSON.parse(Base32.decode(userId.split('@')[0]))

        expect(result.iceServers).to.part.include(iceServers);
        expect(result.iceServers).to.part.include(iceServers);
        expect(result.iceServers[0]).to.include(['username', 'password']);
        expect(decodedUserId.id).to.equal(user.id)
        expect(decodedUserId.scopes).to.equal(user.scopes)
        return server.inject({ method: 'GET', url: `/dashboard/users/${sessionId}` });
      }).then((res) => {

        expect(res.statusCode).to.equal(200);
        return db.users.destroy({ userid: userId });
      });
  })
});