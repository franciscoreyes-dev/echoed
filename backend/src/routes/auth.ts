import { Router, Request, Response } from 'express'

const router = Router()

// POST /auth/token — exchange PKCE code for tokens
// Implemented in step 2 (Spotify OAuth)
router.post('/token', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' })
})

export default router
