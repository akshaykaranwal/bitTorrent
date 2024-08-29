import torrentParser from "./torrent-parser.js";
import { Buffer } from "buffer";

function buildHandshake(torrent){
    const buf=Buffer.alloc(68);
    buf.writeUInt8(19,0);   //pstrlen  1 byte  19  fixed value  19  indicates the length of the protocol string
    buf.write('BitTorrent protocol',1);  //pstr  19 bytes  string  BitTorrent protocol  indicates the protocol being used
    buf.writeUInt32BE(0,20) //reserved  8 bytes  string  0  all bits are set to 0  indicates that no extensions are used
    buf.writeUInt32BE(0,24) //reserved  8 bytes  string  0  all bits are set to 0  indicates that no extensions are used
    torrentParser.infoHash(torrent).copy(buf,28) //info_hash  20 bytes  string  <info_hash>  hash of the info key in the metainfo file
    buf.write(util.genId()); //peer_id  20 bytes  string  <peer_id>  a unique string generated by the client
    return buf;
}

function buildKeepAlive(){ //keep-alive  <len=0000>  4 bytes  0  an empty message with no payload keep the connection open  used to test if the remote peer is still connected
    return Buffer.alloc(4);
}

function buildChoke(){ //choke  <len=0001><id=0>  5 bytes  1  choke  the sender is no longer interested in receiving data
    const buf=Buffer.alloc(5);
    buf.writeUInt32BE(1,0);
    buf.writeUInt8(0,4);
    return buf;
}

function buildUnchoke(){ //unchoke  <len=0001><id=1>  5 bytes  1  unchoke  the sender is interested in receiving data
    const buf=Buffer.alloc(5);
    buf.writeUInt32BE(1,0);
    buf.writeUInt8(1,4);
    return buf;
}

function buildInterested(){ //interested  <len=0001><id=2>  5 bytes  1  interested  the sender is interested in receiving data
    const buf=Buffer.alloc(5);
    buf.writeUInt32BE(1,0);
    buf.writeUInt8(2,4);
    return buf;
}

function buildUninterested(){ //uninterested  <len=0001><id=3>  5 bytes  1  not interested  the sender is not interested in receiving data
    const buf=Buffer.alloc(5);
    buf.writeUInt32BE(1,0);
    buf.writeUInt8(3,4);
    return buf;
}

function buildHave(payload){ //have  <len=0005><id=4><piece index>  9 bytes  1+4  have  the sender has downloaded a piece
    const buf = Buffer.alloc(9);
  // length
  buf.writeUInt32BE(5, 0);
  // id
  buf.writeUInt8(4, 4);
  // piece index
  buf.writeUInt32BE(payload, 5);
  return buf;
}

function buildBitfield(bitfield){ //bitfield  <len=0001+X><id=5><bitfield>  1+X bytes  1+X  bitfield  a bitfield representing the pieces that have been successfully downloaded
    const buf = Buffer.alloc(14);
  // length
  buf.writeUInt32BE(payload.length + 1, 0);
  // id
  buf.writeUInt8(5, 4);
  // bitfield
  bitfield.copy(buf, 5);
  return buf;
}

function buildRequest(payload){ //request  <len=0013><id=6><index><begin><length>  13 bytes  1+4+4+4  request  request a block of data starting at the specified index
    const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(6, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
}

function buildPiece(payload){ //piece  <len=0009+X><id=7><index><begin><block>  9+X bytes  1+4+4+X  piece  the sender has a piece of the file
    const buf = Buffer.alloc(payload.block.length + 13);
  // length
  buf.writeUInt32BE(payload.block.length + 9, 0);
  // id
  buf.writeUInt8(7, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // block
  payload.block.copy(buf, 13);
  return buf;
}

function buildCancel(payload){ //cancel  <len=0013><id=8><index><begin><length>  13 bytes  1+4+4+4  cancel  cancel a request for a block of data
    const buf=Buffer.alloc(17);
    buf.writeUInt32BE(13,0);
    buf.writeUInt8(8,4);
    buf.writeUInt32BE(payload.index,5);
    buf.writeUInt32BE(payload.begin,9);
    buf.writeUInt32BE(payload.length,13);
    return buf;
}

function buildPort(payload){ //port  <len=0003><id=9><listen-port>  7 bytes  1+2+4  port  listen port for DHT
    const buf=Buffer.alloc(7);
    buf.writeUInt32BE(3,0);
    buf.writeUInt8(9,4);
    buf.writeUInt16BE(payload,5);
    return buf;
}

export default {
    buildHandshake,
    buildKeepAlive,
    buildChoke,
    buildUnchoke,
    buildInterested,
    buildUninterested,
    buildHave,
    buildBitfield,
    buildRequest,
    buildPiece,
    buildCancel,    
    buildPort
}