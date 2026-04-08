import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listResumes, createResume, deleteResume } from '../api'

function NewResumeModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '未命名简历', target_role: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const resume = await createResume(form.title, form.target_role || undefined)
      onCreate(resume)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">新建简历</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简历标题</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标职位（可选）</label>
            <input
              type="text"
              value={form.target_role}
              onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：后端工程师"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return `${Math.floor(days / 30)} 个月前`
}

export default function ResumeList() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    listResumes().then(data => {
      setResumes(data.items || [])
      setLoading(false)
    })
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('确认删除这份简历？')) return
    await deleteResume(id)
    setResumes(r => r.filter(x => x.id !== id))
  }

  function handleCreated(resume) {
    setShowNew(false)
    navigate(`/resumes/${resume.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-lg">Resume AI</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.name}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">退出</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">我的简历</h2>
          <button
            onClick={() => setShowNew(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + 新建简历
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中...</div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">还没有简历，创建第一份吧</p>
            <button
              onClick={() => setShowNew(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              + 新建简历
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map(r => (
              <div
                key={r.id}
                onClick={() => navigate(`/resumes/${r.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 truncate flex-1">{r.title}</h3>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    r.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {r.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
                {r.target_role && (
                  <p className="text-sm text-indigo-600 mb-3">🎯 {r.target_role}</p>
                )}
                <p className="text-xs text-gray-400 mb-4">更新于 {timeAgo(r.updated_at)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/resumes/${r.id}`)}
                    className="flex-1 border border-gray-300 text-gray-700 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => handleDelete(r.id, e)}
                    className="border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showNew && <NewResumeModal onClose={() => setShowNew(false)} onCreate={handleCreated} />}
    </div>
  )
}
