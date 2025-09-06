import { Hono } from 'hono'
import { z as zod } from 'zod'
import { serve } from '@hono/node-server'

import { zodValidator } from './index.js'

const app = new Hono()

app.get(
  '/',
  zodValidator({
    query: zod.object({
      page: zod.coerce.number()
    }),
    // json: zod.object({...}),
    // form: zod.object({...}),
    // header: zod.object({...}),
    // param: zod.object({...}),
    // cookie: zod.object({...}),
  }),
  async (c) => {
    return c.json({
      'c.req.valid(\'query\')': c.req.valid('query'),
      'c.req.query()': await c.req.query(),
    })
  }
)

serve(app)
