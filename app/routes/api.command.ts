import { Router } from 'express';
import { actionRunner } from '~/lib/server';

const router = Router();

router.post('/', async (req, res) => {
  const { command, cwd } = req.body;
  
  if (!command || !cwd) {
    return res.status(400).json({ error: 'Missing command or cwd' });
  }

  try {
    const output = await actionRunner.runCommand(command, cwd);
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
