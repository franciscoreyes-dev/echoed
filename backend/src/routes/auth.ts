import { Router, Request, Response } from 'express'
import axios from 'axios'

const router = Router()

interface TokenExchangeBody {
  code: string
  code_verifier: string
  redirect_uri: string
}

interface TokenRefreshBody {
  refresh_token: string
}

interface SpotifyTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

function getBasicAuthHeader(): string {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64')
  return `Basic ${credentials}`
}

// POST /auth/token — exchange PKCE authorization code for tokens
router.post('/token', async (req: Request, res: Response) => {
  const { code, code_verifier, redirect_uri } = req.body as TokenExchangeBody

  if (!code || !code_verifier || !redirect_uri) {
    res.status(400).json({ error: 'Missing required fields: code, code_verifier, redirect_uri' })
    return
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    code_verifier,
  })

  try {
    const response = await axios.post<SpotifyTokenResponse>(
      'https://accounts.spotify.com/api/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: getBasicAuthHeader(),
        },
      }
    )

    res.json({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
    })
  } catch (error) {
    console.error('Token exchange failed:', error instanceof Error ? error.message : error)
    res.status(500).json({ error: 'Token exchange failed' })
  }
})

// POST /auth/refresh — refresh an expired access token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body as TokenRefreshBody

  if (!refresh_token) {
    res.status(400).json({ error: 'Missing required field: refresh_token' })
    return
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
  })

  try {
    const response = await axios.post<Omit<SpotifyTokenResponse, 'refresh_token'>>(
      'https://accounts.spotify.com/api/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: getBasicAuthHeader(),
        },
      }
    )

    res.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    })
  } catch (error) {
    console.error('Token refresh failed:', error instanceof Error ? error.message : error)
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

export default router
