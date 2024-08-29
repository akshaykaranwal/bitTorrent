import dgram from 'dgram';
import getPeers from './src/tracker.js';
import torrentParser from './src/torrent-parser.js';

const torrent = torrentParser.open('./puppy.torrent');
const MAX_ATTEMPTS = 8;

function sendRequestWithRetry(torrent, attempt = 0) {
  getPeers(torrent, (error, peers) => {
    if (error) {
      if (attempt < MAX_ATTEMPTS) {
        const delay = Math.pow(2, attempt) * 15 * 1000; // 2^n * 15 seconds in milliseconds
        console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay / 1000} seconds...`);

        setTimeout(() => {
          sendRequestWithRetry(torrent, attempt + 1);
        }, delay);
      } else {
        console.error('Max retry attempts reached. Could not retrieve peers.');
      }
    } else {
      console.log('List of peers:', peers);
    }
  });
}

// Start the request with retry logic
sendRequestWithRetry(torrent);
