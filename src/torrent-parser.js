'use strict';

import bencode from 'bencode';
import fs from 'fs';
import crypto from 'crypto';
import BigInt from 'big-integer';

function open(filepath){
  return bencode.decode(fs.readFileSync(filepath));
};

function size(torrent){
  // ...
  const size = torrent.info.files ?
    torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
    torrent.info.length;
  
    return BigInt.toBuffer(size, {size: 8});  
};

function infoHash(torrent) {
  // ...
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
};

const BIG_LEN = Math.pow(2,14);

function piecelen(torrent, pieceIndex) {
  const totallen = BigInt.fromBuffer(size(torrent)).toNumber();
  const piecelen = torrent.info['piece length'];
  const lastplen = totallen%piecelen;
  const lastpindex = Math.floor(totallen/piecelen);
  if (pieceIndex === lastpindex) return lastplen;
  return piecelen;
}

function blocksPerPiece(torrent, pieceIndex) {
  const pieceLength = piecelen(torrent, pieceIndex);
  return Math.ceil(pieceLength / this.BIG_LEN);
}

function blockLen(torrent, pieceIndex, blockIndex) {  
  const pieceLength = piecelen(torrent, pieceIndex);
  const lastPieceLength = pieceLength % this.BIG_LEN;
  const lastpindex = Math.floor(pieceLength / this.BIG_LEN);
  if (blockIndex === lastpindex) return lastPieceLength;
  return this.BIG_LEN;
}

export default { open, size, infoHash };