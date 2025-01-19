import { Router } from 'express';
import { fileStore } from '~/lib/server';

const router = Router();

router.post('/', async (req, res) => {
  const { action, path, content } = req.body;
  
  switch (action) {
    case 'write': {
      if (!path || !content) {
        return res.status(400).json({ error: 'Missing path or content' });
      }

      try {
        const success = await fileStore.writeFile(path, content);
        res.json({ success });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
      break;
    }
    
    default:
      res.status(400).json({ error: 'Invalid action' });
  }
});

export default router;
