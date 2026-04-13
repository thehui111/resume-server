import { useState, useEffect, useRef } from 'react'
import {
  saveSection,
  uploadAvatar,
  optimizeAvatar,
  changeAvatarBackground,
  editImageByPrompt,
  bananaGenerateImage,
  seedreamGenerateImage,
} from '../../api'
import {
  Upload,
  Sparkles,
  Palette,
  Wand2,
  ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'

const EMPTY = { name: '', email: '', phone: '', location: '', linkedin: '', github: '', avatar_url: '' }

const BG_PRESETS = [
  { label: '纯白', value: 'white', class: 'bg-white border-gray-200' },
  { label: '浅蓝', value: 'lightblue', class: 'bg-sky-100 border-sky-200' },
  { label: '浅灰', value: 'lightgray', class: 'bg-gray-100 border-gray-200' },
  { label: '蓝色', value: 'blue', class: 'bg-blue-500 border-blue-600 text-white' },
]

const BANANA_MODELS = [
  { label: 'Banana 2（默认，速度快）', value: 'banana2', use_pro_model: false },
  { label: 'Banana Pro（高清，支持分辨率）', value: 'banana_pro', use_pro_model: true },
]

const SEEDREAM_MODELS = [
  { label: 'seedream-5-0-260128', value: 'seedream-5-0-260128' },
  { label: 'seedream-5-0', value: 'seedream-5-0' },
]

export default function BasicInfo({ resumeId, data, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeError, setOptimizeError] = useState('')
  const [changingBg, setChangingBg] = useState(false)
  const [bgError, setBgError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [engine, setEngine] = useState('edit')
  const [model, setModel] = useState('banana2')
  const [imageSize, setImageSize] = useState('1K')
  const [prompt, setPrompt] = useState('')
  const [processingAdvanced, setProcessingAdvanced] = useState(false)
  const [advancedError, setAdvancedError] = useState('')
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

  async function handleOptimize() {
    if (!form.avatar_url) return
    setOptimizeError('')
    setOptimizing(true)
    try {
      const url = await optimizeAvatar(form.avatar_url)
      const newForm = { ...form, avatar_url: url }
      setForm(newForm)
      await saveSection(resumeId, 'basic_info', newForm, 0)
      onSaved?.('basic_info', newForm)
    } catch (e) {
      setOptimizeError(e.message)
    } finally {
      setOptimizing(false)
    }
  }

  async function handleChangeBg(color) {
    if (!form.avatar_url) return
    setBgError('')
    setChangingBg(true)
    try {
      const url = await changeAvatarBackground(form.avatar_url, color)
      const newForm = { ...form, avatar_url: url }
      setForm(newForm)
      await saveSection(resumeId, 'basic_info', newForm, 0)
      onSaved?.('basic_info', newForm)
    } catch (e) {
      setBgError(e.message)
    } finally {
      setChangingBg(false)
    }
  }

  async function handleAdvancedAction() {
    if (!form.avatar_url || !prompt.trim()) return
    setAdvancedError('')
    setProcessingAdvanced(true)
    try {
      let url = ''
      if (engine === 'edit') {
        url = await editImageByPrompt(prompt.trim(), form.avatar_url)
      } else if (engine === 'banana') {
        const bananaModel = BANANA_MODELS.find(m => m.value === model) || BANANA_MODELS[0]
        url = await bananaGenerateImage({
          text: prompt.trim(),
          image_urls: [form.avatar_url],
          use_pro_model: bananaModel.use_pro_model,
          image_size: imageSize,
        })
      } else if (engine === 'seedream') {
        url = await seedreamGenerateImage({
          prompt: prompt.trim(),
          image_urls: [form.avatar_url],
          model: model || 'seedream-5-0-260128',
        })
      }
      const newForm = { ...form, avatar_url: url }
      setForm(newForm)
      await saveSection(resumeId, 'basic_info', newForm, 0)
      onSaved?.('basic_info', newForm)
      setPrompt('')
    } catch (e) {
      setAdvancedError(e.message)
    } finally {
      setProcessingAdvanced(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageSelect(file)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
      </div>

      {/* Avatar Card */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-2xl border border-indigo-100 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar Upload */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 cursor-pointer flex items-center justify-center overflow-hidden bg-white shadow-sm transition-all hover:shadow-md group"
            >
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <User className="w-8 h-8 text-indigo-300 mx-auto mb-1" />
                  <span className="text-indigo-400 text-xs">点击上传</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-xs text-indigo-600 mt-1">上传中</span>
                </div>
              )}
              {!uploading && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => handleImageSelect(e.target.files?.[0])}
            />
            <p className="text-center sm:text-left text-xs text-gray-400 mt-2">JPG / PNG / WebP，最大 5MB</p>
          </div>

          {/* Avatar Tools */}
          <div className="flex-1 min-w-0 space-y-4">
            {!form.avatar_url ? (
              <div className="text-sm text-gray-500 bg-white rounded-xl border border-gray-100 p-4">
                <p>上传一张清晰的证件照，将显示在简历右上角。</p>
                <p className="text-gray-400 mt-1">你也可以拖拽图片到左侧上传区域。</p>
              </div>
            ) : (
              <>
                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {optimizing ? '优化中...' : 'AI 优化头像'}
                  </button>

                  <div className="h-5 w-px bg-gray-200 mx-1" />

                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    换背景
                  </span>
                  {BG_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => handleChangeBg(p.value)}
                      disabled={changingBg}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-all disabled:opacity-50 ${p.class}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Secondary Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                    {showAdvanced ? '收起高级编辑' : 'AI 高级编辑'}
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={async () => {
                      const newForm = { ...form, avatar_url: '' }
                      setForm(newForm)
                      await saveSection(resumeId, 'basic_info', newForm, 0)
                      onSaved?.('basic_info', newForm)
                    }}
                    className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    移除图片
                  </button>
                </div>
              </>
            )}

            {/* Error Message */}
            {(uploadError || optimizeError || bgError || advancedError) && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{uploadError || optimizeError || bgError || advancedError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Advanced AI Edit Panel */}
        {showAdvanced && form.avatar_url && (
          <div className="mt-5 pt-5 border-t border-indigo-100">
            <div className="bg-white rounded-xl border border-indigo-100 p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                高级图片编辑
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">引擎</label>
                  <select
                    value={engine}
                    onChange={e => {
                      setEngine(e.target.value)
                      if (e.target.value === 'banana') setModel('banana2')
                      else if (e.target.value === 'seedream') setModel('seedream-5-0-260128')
                    }}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="edit">通用编辑 (video-base-v4)</option>
                    <option value="banana">Banana</option>
                    <option value="seedream">Seedream</option>
                  </select>
                </div>

                {engine === 'banana' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">模型</label>
                      <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {BANANA_MODELS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">分辨率</label>
                      <select
                        value={imageSize}
                        onChange={e => setImageSize(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                        <option value="4K">4K</option>
                      </select>
                    </div>
                  </>
                )}

                {engine === 'seedream' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">模型</label>
                    <select
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {SEEDREAM_MODELS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">提示词</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={
                    engine === 'edit'
                      ? '输入编辑指令，例如：把背景换成纯白色，穿西装'
                      : engine === 'banana'
                      ? '输入生成提示词，例如：专业证件照，白背景，穿正装'
                      : '输入生成提示词，例如：高清人像，浅灰背景'
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Action */}
              <div className="flex justify-end">
                <button
                  onClick={handleAdvancedAction}
                  disabled={processingAdvanced || !prompt.trim()}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {processingAdvanced ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      {engine === 'edit' ? '执行编辑' : '生成图片'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { key: 'name', label: '姓名', type: 'text', placeholder: '张三' },
            { key: 'phone', label: '电话', type: 'tel', placeholder: '138xxxxxxxx' },
            { key: 'email', label: '邮箱', type: 'email', placeholder: 'you@example.com' },
            { key: 'location', label: '城市', type: 'text', placeholder: '北京' },
            { key: 'linkedin', label: 'LinkedIn', type: 'text', placeholder: 'linkedin.com/in/xxx' },
            { key: 'github', label: 'GitHub', type: 'text', placeholder: 'github.com/xxx' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存基本信息'}
        </button>
      </div>
    </div>
  )
}
