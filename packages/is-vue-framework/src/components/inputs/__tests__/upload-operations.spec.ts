import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('upload operation boundary', () => {
  it.each(['FileInput.vue', 'ImageInput.vue', 'CameraInput.vue', 'DrawingCanvas.vue'])('%s avoids wired upload runtime', (name) => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/inputs', name), 'utf8')
    expect(source).not.toMatch(/useFrameworkRuntime|missingRuntimeCapability|runtime\.upload/)
  })
})
