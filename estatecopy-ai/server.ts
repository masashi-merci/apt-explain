
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cors from 'cors';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Cloudflare R2 Setup ---
  // R2のキーはサーバー側でのみ保持し、クライアントには露出させません
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  // --- API Routes ---

  // R2 Presigned URL for Uploads
  app.get('/api/storage/upload-url', async (req, res) => {
    try {
      const { fileName, contentType } = req.query;
      if (!fileName || !contentType) {
        return res.status(400).json({ error: 'Missing fileName or contentType' });
      }

      const key = `uploads/${Date.now()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType as string,
      });

      const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
      const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

      res.json({ uploadUrl: url, publicUrl });
    } catch (error) {
      console.error('R2 Error:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  // Google Maps API Proxy
  app.get('/api/maps/search', async (req, res) => {
    try {
      const { query } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query as string)}&language=ja&key=${apiKey}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Maps Search Error:', error);
      res.status(500).json({ error: 'Failed to search places' });
    }
  });

  app.get('/api/maps/nearby', async (req, res) => {
    try {
      const { location, radius, type, rankby, keyword } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });

      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&language=ja&key=${apiKey}`;
      
      if (rankby === 'distance') {
        url += `&rankby=distance`;
      } else if (radius) {
        url += `&radius=${radius}`;
      }

      if (type) url += `&type=${type}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword as string)}`;

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Maps Nearby Error:', error);
      res.status(500).json({ error: 'Failed to find nearby places' });
    }
  });

  app.get('/api/maps/distance', async (req, res) => {
    try {
      const { origins, destinations, mode, departure_time } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Google Maps API Key not configured' });

      let url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins as string)}&destinations=${encodeURIComponent(destinations as string)}&mode=${mode || 'walking'}&language=ja&key=${apiKey}`;
      
      if (departure_time) {
        url += `&departure_time=${departure_time}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Maps Distance Error:', error);
      res.status(500).json({ error: 'Failed to calculate distance' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
