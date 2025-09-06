import { every } from 'hono/combine'
import { validator } from 'hono/validator'
import { HTTPException } from 'hono/http-exception'
import { fromError } from 'zod-validation-error'

export function zodValidator (schemas) {
  if (typeof schemas !== 'object') {
    throw new Error('schemas should be an object')
  }
  for (const key in schemas) {
    const schema = schemas[key]
    if (!schema || typeof schema.safeParseAsync !== 'function') {
      throw new Error(`Schema for "${key}" must be a Zod schema`)
    }
  }

  const keys = Object.keys(schemas)
  return every(...keys.map(key => validator(key, async (value, c) => {
    let validatorValue = value
    const schema = schemas[key]
    const isHeader = (key === 'header') && ('_zod' in schema)

    if (isHeader) {
      const schemaKeys = Object.keys(schema.shape)
      const caseInsensitiveKeymap = Object.fromEntries(
        schemaKeys.map((k) => [k.toLowerCase(), k])
      )
      validatorValue = Object.fromEntries(
        Object.entries(value).map(([k, v]) => [caseInsensitiveKeymap[k] || k, v])
      )
    }

    const result = await schema.safeParseAsync(validatorValue)

    if (!result.success) {
      const zodError = result.error
      zodError.issues.forEach(issue => {
        // remove `Invalid input: `
        issue.message = issue.message.replace(/^Invalid input: /, '').trim()
        // add prefix to `path`
        issue.path = [key, ...issue.path]
      })

      const prettyError = fromError(zodError)
      throw new HTTPException(400, { message: prettyError })
    }

    if (isHeader) {
      return Object.fromEntries(
        Object.entries(result.data).map(([k, v]) => [k.toLowerCase(), v])
      )
    } else {
      return result.data
    }
  })))
}
