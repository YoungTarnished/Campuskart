const API = import.meta.env.VITE_API_URL || ''

export async function api(path, { method = 'GET', body, token, formData } = {}) {
  const headers = {}
  const authToken = token ?? localStorage.getItem('campuskart_token')
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  let payload
  if (formData) payload = formData
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(`${API}${path}`, { method, headers, body: payload })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/api/auth/login') && !path.startsWith('/api/auth/register')) {
      window.dispatchEvent(new Event('auth:expired'))
    }
    const error = new Error(data.message || 'Request failed')
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}

export async function uploadImages(files) {
  const form = new FormData()
  for (const file of files) form.append('images', file)
  const result = await api('/api/uploads', { method: 'POST', formData: form })
  return result.data.urls
}
