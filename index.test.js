import { Hono } from 'hono'
import { z as zod } from 'zod'
import { getCookie } from 'hono/cookie'
import { zodValidator } from './index.js'

describe('hono-zod', () => {
  it('No schemas', async () => {
    const app = new Hono()
    try {
      app.post(
        '/',
        zodValidator(),
        async (c) => {
          return c.text('Hello, hono-zod!')
        }
      )
    } catch (e) {
      expect(e.message).toBe('schemas should be an object')
    }
  })

  it('Wrong schema', async () => {
    const app = new Hono()
    try {
      app.post(
        '/',
        zodValidator({
          json: {
            key: 1
          }
        }),
        async (c) => {
          return c.text('Hello, hono-zod!')
        }
      )
    } catch (e) {
      expect(e.message).toBe('Schema for "json" must be a Zod schema')
    }
  })

  it('c.req.valid(\'json\') -> success', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        json: zod.object({
          key1: zod.string(),
          key2: zod.coerce.number(),
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'json\')': c.req.valid('json'),
          'c.req.json()': await c.req.json(),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key1: '1',
        key2: '2',
        key3: '3'
      })
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      'c.req.valid(\'json\')': {
        key1: '1',
        key2: 2
      },
      'c.req.json()': {
        key1: '1',
        key2: '2',
        key3: '3'
      }
    })
  })

  it('c.req.valid(\'json\') -> fail', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        json: zod.object({
          key1: zod.string(),
          key2: zod.string(),
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'json\')': c.req.valid('json'),
          'c.req.json()': await c.req.json(),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key1: 1,
        key2: 2,
        key3: 3
      })
    })
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('Validation error: Expected string, received number at "json.key1"; Expected string, received number at "json.key2"')
  })

  it('c.req.valid(\'form\') -> success', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        form: zod.object({
          key1: zod.string(),
          key2: zod.coerce.number(),
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'form\')': c.req.valid('form'),
          'c.req.parseBody()': await c.req.parseBody(),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'key1=1&key2=2&key3=3'
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      'c.req.valid(\'form\')': {
        key1: '1',
        key2: 2
      },
      'c.req.parseBody()': {
        key1: '1',
        key2: '2',
        key3: '3'
      }
    })
  })

  it('c.req.valid(\'form\') -> fail', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        form: zod.object({
          key1: zod.string(),
          key2: zod.coerce.number(),
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'form\')': c.req.valid('form'),
          'c.req.parseBody()': await c.req.parseBody(),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'key1=1&key2=value2&key3=3'
    })
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('Validation error: Expected number, received NaN at "form.key2"')
  })

  it('c.req.valid(\'query\') -> success', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        query: zod.object({
          key1: zod.string(),
          key2: zod.coerce.number(),
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'query\')': c.req.valid('query'),
          'c.req.query()': await c.req.query(),
        })
      }
    )

    const res = await app.request('/?key1=1&key2=2&key3=3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      'c.req.valid(\'query\')': {
        key1: '1',
        key2: 2
      },
      'c.req.query()': {
        key1: '1',
        key2: '2',
        key3: '3'
      }
    })
  })

  it('c.req.valid(\'query\') -> fail', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        query: zod.object({
          key1: zod.number(),
          key2: zod.number(),
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'query\')': c.req.valid('query'),
          'c.req.query()': await c.req.query(),
        })
      }
    )

    const res = await app.request('/?key1=1&key2=2&key3=3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('Validation error: Expected number, received string at "query.key1"; Expected number, received string at "query.key2"')
  })

  it('c.req.valid(\'param\') -> success', async () => {
    const app = new Hono()
    app.post(
      '/:id',
      zodValidator({
        param: zod.object({
          id: zod.coerce.number(),
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'param\')': c.req.valid('param'),
          'c.req.param()': await c.req.param(),
        })
      }
    )

    const res = await app.request('/1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      'c.req.valid(\'param\')': {
        id: 1
      },
      'c.req.param()': {
        id: '1'
      }
    })
  })

  it('c.req.valid(\'param\') -> fail', async () => {
    const app = new Hono()
    app.post(
      '/:id',
      zodValidator({
        param: zod.object({
          id: zod.number()
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'param\')': c.req.valid('param'),
          'c.req.param()': await c.req.param(),
        })
      }
    )

    const res = await app.request('/1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('Validation error: Expected number, received string at "param.id"')
  })

  it('c.req.valid(\'header\') -> success', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        header: zod.object({
          'X-Request-Id': zod.uuidv4(),
          'x-request-user': zod.coerce.number()
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'header\')': c.req.valid('header'),
          'c.req.header()': await c.req.header(),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'X-Request-Id': '7ea0fa3c-0701-49a1-add5-da67f83dbe44',
        'X-Request-User': '1',
        'X-Request-Extra': '2'
      }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      'c.req.valid(\'header\')': {
        'x-request-id': '7ea0fa3c-0701-49a1-add5-da67f83dbe44',
        'x-request-user': 1
      },
      'c.req.header()': {
        'x-request-id': '7ea0fa3c-0701-49a1-add5-da67f83dbe44',
        'x-request-user': '1',
        'x-request-extra': '2'
      }
    })
  })

  it('c.req.valid(\'header\') -> fail', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        header: zod.object({
          'X-Request-Id': zod.uuidv4(),
          'x-request-user': zod.number()
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'header\')': c.req.valid('header'),
          'c.req.header()': await c.req.header(),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        'X-Request-Id': 'testRequestId',
      }
    })
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('Validation error: Invalid UUID at "header.X-Request-Id"; Expected number, received undefined at "header.x-request-user"')
  })

  it('c.req.valid(\'cookie\') -> success', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        cookie: zod.object({
          key1: zod.string(),
          key2: zod.coerce.number()
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'cookie\')': c.req.valid('cookie'),
          'getCookie(c)': getCookie(c),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        Cookie: 'key1=1;key2=2',
      }
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      'c.req.valid(\'cookie\')': {
        key1: '1',
        key2: 2
      },
      'getCookie(c)': {
        key1: '1',
        key2: '2'
      }
    })
  })

  it('c.req.valid(\'cookie\') -> fail', async () => {
    const app = new Hono()
    app.post(
      '/',
      zodValidator({
        cookie: zod.object({
          key1: zod.string(),
          key2: zod.number()
        })
      }),
      async (c) => {
        return c.json({
          'c.req.valid(\'cookie\')': c.req.valid('cookie'),
          'getCookie(c)': getCookie(c),
        })
      }
    )

    const res = await app.request('/', {
      method: 'POST',
      headers: {
        Cookie: 'key1=1;key2=value2',
      }
    })
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('Validation error: Expected number, received string at "cookie.key2"')
  })

  it('404', async () => {
    const app = new Hono()
    app.get('/', (c) => {
      return c.json('Hello, Hono!')
    })

    const res = await app.request('/404')
    expect(res.status).toBe(404)
    expect(await res.text()).toBe('404 Not Found')
  })
})
