import { Router } from 'express';
import { terminalStore } from '~/lib/server';

const router = Router();

router.post('/', async (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing terminal id' });
  }

  try {
    await terminalStore.createTerminal(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
