import { NextApiRequest, NextApiResponse } from 'next';
import { validateApiKey } from '@/lib/api-key-validation';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { provider, key } = req.body;
      const result = await validateApiKey(provider, key);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}