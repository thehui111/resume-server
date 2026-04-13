const BASE = ''

function getToken() {
  return localStorage.getItem('token')
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

function handleUnauthorized() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login?expired=1'
}

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('登录已过期，请重新登录')
  }
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '请求失败')
  return json.data
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function register(email, password, name) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '注册失败')
  return json.data
}

export async function login(email, password) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '登录失败')
  return json.data
}

// ── Resume ────────────────────────────────────────────────────────────────
export const createResume = (title, target_role) =>
  request('POST', '/resume/create', { title, target_role })

export const listResumes = (page = 1, page_size = 20) =>
  request('POST', '/resume/list', { page, page_size })

export const detailResume = (id) =>
  request('POST', '/resume/detail', { id })

export const updateResume = (data) =>
  request('POST', '/resume/update', data)

export const deleteResume = (id) =>
  request('POST', '/resume/delete', { id })

export const saveSection = (resume_id, section_type, content, order_index = 0) =>
  request('POST', '/resume/section/save', { resume_id, section_type, content, order_index })

export const deleteSection = (resume_id, section_type) =>
  request('POST', '/resume/section/delete', { resume_id, section_type })

export const listTemplates = () =>
  request('GET', '/resume/templates')

// ── AI (SSE) ──────────────────────────────────────────────────────────────
export async function aiGenerateStream(resume_id, target_role, raw_info, sections) {
  const res = await fetch('/ai/generate', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ resume_id, target_role, raw_info, sections }),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  return res
}

export async function aiJdOptimizeStream(resume_id, jd_text, section_types) {
  const res = await fetch('/ai/jd-optimize', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ resume_id, jd_text, section_types }),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  return res
}

// ── PDF ───────────────────────────────────────────────────────────────────
export async function exportPdf(resume_id, template_name = 'default.html') {
  const res = await fetch('/resume/export/pdf', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ resume_id, template_name }),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  if (!res.ok) throw new Error('PDF 导出失败')
  return res.blob()
}

// ── 图片上传 ──────────────────────────────────────────────────────────────
export async function uploadAvatar(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/resume/upload-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '上传失败')
  return json.data.url
}

// ── Avatar AI ─────────────────────────────────────────────────────────────
export async function optimizeAvatar(image_url) {
  const res = await fetch('/avatar/optimize', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ image_url }),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '优化失败')
  return json.data.image_url
}

export async function changeAvatarBackground(image_url, background_color) {
  const res = await fetch('/avatar/change-background', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ image_url, background_color }),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '修改背景失败')
  return json.data.image_url
}

// ── Image Generation / Edit ───────────────────────────────────────────────
export async function bananaGenerateImage(data) {
  const res = await fetch('/image/banana/generate', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || 'Banana 生图失败')
  return json.data.image_url
}

export async function seedreamGenerateImage(data) {
  const res = await fetch('/image/seedream/generate', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || 'Seedream 生图失败')
  return json.data.image_url
}

export async function editImageByPrompt(prompt, image_url, aspect_ratio = 'VIDEO_ASPECT_RATIO_LANDSCAPE') {
  const res = await fetch('/image/edit', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ prompt, image_url, aspect_ratio }),
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  const json = await res.json()
  if (json.code !== 0) throw new Error(json.message || '图片编辑失败')
  return json.data.image_url
}

// ── AI 文本润色 ───────────────────────────────────────────────────────────
export async function polishText(text, section_type = '', field = '') {
  return request('POST', '/ai/polish-text', { text, section_type, field })
}

// ── 预览 ──────────────────────────────────────────────────────────────────
export async function previewResume(resume_id, template_name = 'default.html') {
  const res = await fetch(`/resume/${resume_id}/preview?template_name=${template_name}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('登录已过期') }
  if (!res.ok) throw new Error('预览失败')
  return res.text()
}
