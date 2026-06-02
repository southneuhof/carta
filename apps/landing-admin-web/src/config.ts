const config = {
  name: 'Must Chick | PT Mustika Jaya Lestari',
  apiUrl: (() => {
    const raw = import.meta.env.VITE_API_URL || ''
    return raw && !raw.endsWith('/') ? `${raw}/` : raw
  })(),
}

export default config
