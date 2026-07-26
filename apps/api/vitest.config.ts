import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Every spec here rebuilds its own tables in `beforeEach` against one real
    // Postgres. Running files in parallel means one file drops the tables another
    // is mid-way through using, so the suite is serial by construction.
    fileParallelism: false,
  },
})
