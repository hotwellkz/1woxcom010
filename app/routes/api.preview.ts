import { Router } from 'express';
import { previewStore } from '~/lib/server';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PreviewAPI');
const router = Router();

router.post('/', async (req, res) => {
  const { port } = req.body;
  
  if (!port) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing port parameter' 
    });
  }

  try {
    const actualPort = await previewStore.startPreviewServer(Number(port));
    logger.info(`Preview server started on port ${actualPort}`);
    
    res.json({ 
      success: true,
      data: { port: actualPort }
    });
  } catch (error) {
    logger.error('Failed to start preview server:', error);
    res.status(500).json({ 
      success: false,
      error: String(error) 
    });
  }
});

export default router;
