import { useState, useEffect, useRef } from 'react'
import { saveSection, uploadAvatar } from '../../api'

const EMPTY = { name: '', email: '', phone: '', location: '', linkedin: '', github: '', avatar_url: '' }

export default function BasicInfo({ resumeId, data, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (data) setForm({ ...EMPTY, ...data })
  }, [data])

  async function handleSave() {
    setSaving(true)
    try {
      await saveSection(resumeId, 'basic_info', form, 0)
      onSaved?.('basic_info', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleImageSelect(file) {
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadAvatar(file)
      const newForm = { ...form, avatar_url: url }
      setForm(newForm)
      await saveSection(resumeId, 'basic_info', newForm, 0)
      onSaved?.('basic_info', newForm)
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageSelect(file)
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-4">基本信息</h3>

      {/* Avatar upload */}
      <div className="mb-5 flex items-center gap-4">
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-indigo-400 cursor-pointer flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0 transition-colors"
        >
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="头像" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs text-center leading-tight px-1">
              {uploading ? '上传中' : '点击上传'}
            </span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs text-indigo-600">上传中...</span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">证件照 / 头像</p>
          <p>支持 JPG、PNG、WebP，最大 5MB</p>
          <p>将显示在简历右上角</p>
          {form.avatar_url && (
            <button
              onClick={async () => {
                const newForm = { ...form, avatar_url: '' }
                setForm(newForm)
                await saveSection(resumeId, 'basic_info', newForm, 0)
                onSaved?.('basic_info', newForm)
              }}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              移除图片
            </button>
          )}
          {uploadError && <p className="text-red-500">{uploadError}</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => handleImageSelect(e.target.files?.[0])}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('name', '姓名', 'text', '张三')}
        {field('phone', '电话', 'tel', '138xxxxxxxx')}
        {field('email', '邮箱', 'email', 'you@example.com')}
        {field('location', '城市', 'text', '北京')}
        {field('linkedin', 'LinkedIn', 'text', 'linkedin.com/in/xxx')}
        {field('github', 'GitHub', 'text', 'github.com/xxx')}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
        </button>
      </div>
    </div>
  )
}
