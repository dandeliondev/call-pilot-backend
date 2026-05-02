import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { generatePitchCategories } from './generatePitch.js'

const PORT = Number(process.env.PORT) || 4000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'

const app = express()
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json({ limit: '64kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pitch-api' })
})

app.post('/api/campaign/pitch', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name : ''
    const description =
      typeof req.body?.description === 'string' ? req.body.description : ''
    if (!name.trim() || !description.trim()) {
      res.status(400).json({ error: 'name and description are required' })
      return
    }

    const categories = await generatePitchCategories({
      name,
      description,
    })
    res.json({ categories })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Pitch generation failed'
    console.error('[pitch]', e)
    res.status(502).json({ error: msg })
  }
})

app.listen(PORT, () => {
  console.error(`Pitch API listening on http://localhost:${PORT}`)
})
