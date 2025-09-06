## hono-zod

A simple validation middleware for Hono, using [zod](https://github.com/colinhacks/zod) and [zod-validation-error](https://github.com/causaly/zod-validation-error).

### Install

```sh
$ npm i hono-zod --save
```

### Usage

hono-zod uses `hono/validator` internally.

```js
zodValidator({
  query?: ZodSchema,
  json?: ZodSchema,
  form?: ZodSchema,
  header?: ZodSchema,
  param?: ZodSchema,
  cookie?: ZodSchema,
})
```

### Example

```js
import { Hono } from 'hono'
import { z as zod } from 'zod'
import { serve } from '@hono/node-server'
import { zodValidator } from 'hono-zod'

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

```

Request `/`:

```js
GET / -> 400

Validation error: Expected number, received NaN at "query.page"
```

Request `/?page=1`:

```js
GET /?page=1 -> 200

{
  "c.req.valid('query')": {
    "page": 1  // <- Modified by zod
  },
  "c.req.query()": {
    "page": "1"
  }
}
```

More examples see [test](./index.test.js)

### Test(100% coverage rate)

```sh
$ npm test
```

### License

MIT
