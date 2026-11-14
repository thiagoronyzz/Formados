import { handleMarket } from '../lib/market.js';

export default function handler(req, res) {
  return handleMarket(req, res, '/api/search');
}
