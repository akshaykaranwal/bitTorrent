import dgram from 'dgram';
import urlParse from 'url-parse';
import crypto from 'crypto';
import torrentParser from './torrent-parser.js';
import util from '../util.js';

function decodeBytes(bytes) {
    return Buffer.from(bytes).toString('utf8');
  }

// Function to get peers from the tracker
function getPeers(torrent, callback) {
    const socket = dgram.createSocket('udp4');
    const urlString = decodeBytes(torrent.announce);
    const url = urlParse(urlString);
    console.log('URL:', url);
    // Send connect request
    udpSend(socket, buildConnReq(), url);

    socket.on('message', res => {
        if (respType(res) === 'connect') {
            // Receive and parse connect response
            const connRes = parseConnResp(res);
            // Send announce request
            const announceReq = buildAnnounceReq(connRes.connectionId,torrent);
            udpSend(socket, announceReq, url);
        } else if (respType(res) === 'announce') {
            const announceRes = parseAnnounceResp(res);
            callback(announceRes.peers);
        }
    });
}

// Function to send UDP messages
function udpSend(socket, message, rawUrl, callback = () => {}) {
    const url = urlParse(rawUrl);
    const port = url.port || 80;
    console.log('Sending message:', message.toString());
  console.log('To URL:', url.hostname, 'Port:', port);
    socket.send(message, 0, message.length, port, url.hostname, callback);
}

// Function to determine response type
function respType(resp) {
    const action = resp.readUInt32BE(0);
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
  }

// Function to build connect request
function buildConnReq() {
    const buf = Buffer.alloc(16); // 2

  // connection id
  buf.writeUInt32BE(0x417, 0); // 3
  buf.writeUInt32BE(0x27101980, 4);
  // action
  buf.writeUInt32BE(0, 8); // 4
  // transaction id
  crypto.randomBytes(4).copy(buf, 12); // 5

  return buf;
}

// Function to parse connect response
function parseConnResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
      }
}

// Function to build announce request
function buildAnnounceReq(connId, torrent, port=6881) {
    const buf = Buffer.allocUnsafe(98);
  
    // connection id
    connId.copy(buf, 0);
    // action
    buf.writeUInt32BE(1, 8);
    // transaction id
    crypto.randomBytes(4).copy(buf, 12);
    // info hash
    torrentParser.infoHash(torrent).copy(buf, 16);
    // peerId
    util.genId().copy(buf, 36);
    // downloaded
    Buffer.alloc(8).copy(buf, 56);
    // left
    torrentParser.size(torrent).copy(buf, 64);
    // uploaded
    Buffer.alloc(8).copy(buf, 72);
    // event
    buf.writeUInt32BE(0, 80);
    // ip address
    buf.writeUInt32BE(0, 80);
    // key
    crypto.randomBytes(4).copy(buf, 88);
    // num want
    buf.writeInt32BE(-1, 92);
    // port
    buf.writeUInt16BE(port, 96);
  
    return buf;
  }

// Function to parse announce response
function parseAnnounceResp(resp) {
    function group(iterable, groupSize) {
      let groups = [];
      for (let i = 0; i < iterable.length; i += groupSize) {
        groups.push(iterable.slice(i, i + groupSize));
      }
      return groups;
    }
  
    return {
      action: resp.readUInt32BE(0),
      transactionId: resp.readUInt32BE(4),
      leechers: resp.readUInt32BE(8),
      seeders: resp.readUInt32BE(12),
      peers: group(resp.slice(20), 6).map(address => {
        return {
          ip: address.slice(0, 4).join('.'),
          port: address.readUInt16BE(4)
        }
      })
    }
  }
export default getPeers;