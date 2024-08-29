import torrentParser from './src/torrent-parser.js';
import {download} from './src/download.js';

const torrent = torrentParser.open('./puppy.torrent');

download(torrent,torrent.info.name);
