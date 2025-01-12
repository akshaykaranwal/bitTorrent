import net from 'net';
import Buffer from 'buffer';
import tracker from './tracker.js';
import { on } from 'events';
import message from './message.js';
import Pieces from './Pieces.js';
import Queue from './Queue.js';
import fs from 'fs';


torrent => {
    tracker.getPeers(torrent,peers=>{
        const pieces=new Pieces(torrent.info.pieces.length/20);
        peers.forEach(peer=>{
            download(peer,torrent,pieces);
        })
    })
}

function download(peer,torrent, pieces) {   
    const queue=new Queue(torrent);
    const socket=net.Socket();
    socket.on('error',console.log);
    socket.connect(peer.port,peer.ip,()=>{
        socket.write(message.buildHandshake(torrent));
    })
    socket.on('data',data=>{

    })

    onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue));
}

function msgHandler(msg, socket,pieces,queue) {
    if(isHandshake(msg)){ 
         socket.write(message.buildInterested());
    }
    else {
        const m = message.parse(msg);
    
        if (m.id === 0) chokeHandler(socket);
        if (m.id === 1) unchokeHandler(socket, pieces, queue);
        if (m.id === 4) haveHandler(m.payload);
        if (m.id === 5) bitfieldHandler(m.payload);
        if (m.id === 7) pieceHandler(m.payload);
      }
}

function isHandshake(msg) {
    return msg.length === msg.readUInt8(0) + 49 &&
           msg.toString('utf8', 1) === 'BitTorrent protocol';
}

function onWholeMsg(socket,callback){
    let savedBuf=Buffer.alloc(0);
    let handshake=true;

    socket.on('data',recBuf=>{
        // msgLen calculates the length of a whole message
        const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
        savedBuf = Buffer.concat([savedBuf, recBuf]);

        while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
            callback(savedBuf.slice(0, msgLen()));
            savedBuf = savedBuf.slice(msgLen());
            handshake = false;
    }
    })
}

function chokeHandler(socket) {
    socket.end();
 }

function unchokeHandler() { 
    queue.chocked = false;
    requestPiece(socket,pieces,queue);
}

function haveHandler(payload, socket, pieces, queue) {

    const pieceIndex = payload.readUInt32BE(0);
    const queueEmpty = queue.length === 0;
    queue.queue(pieceIndex);
    if(queueEmpty) requestPiece(socket,pieces,queue);
  }

function bitfieldHandler(payload, socket, pieces, queue) { 
    const queueEmpty = queue.length === 0;
    payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  });
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function pieceHandler(socket, pieces, queue, torrent, pieceResp) {
    console.log(pieceResp);
  pieces.addReceived(pieceResp);

  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

  if (pieces.isDone()) {
    console.log('DONE!');
    socket.end();
    try { fs.closeSync(file); } catch(e) {}
  } else {
    requestPiece(socket,pieces, queue);
  }
  }

function requestPiece(socket,pieces,queue){
    if(queue.chocked) return null;
    while(queue.length){
        const pieceBlock=queue.deque();
        if(pieces.needed(pieceIndex)){
            socket.write(message.buildRequest(pieceBlock));
            requested.addRequested(pieceBlock);
            break;
        }
    }

}

(torrent, path) => {
    tracker.getPeers(torrent, peers => {
      const pieces = new Pieces(torrent);
      const file = fs.openSync(path, 'w');
      peers.forEach(peer => download(peer, torrent, pieces, file));
    });
  };


export {download,onWholeMsg, msgHandler, isHandshake, chokeHandler, unchokeHandler, haveHandler, bitfieldHandler, pieceHandler, requestPiece};