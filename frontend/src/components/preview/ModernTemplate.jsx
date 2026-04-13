import PreviewEditable from './PreviewEditable'
import useTemplateEdit from './useTemplateEdit'

export default function ModernTemplate({ sections, editable, onEdit }) {
  const { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills } = useTemplateEdit(sections, onEdit)

  return (
    <div style={{ fontFamily: '"NotoSansSC", "PingFang SC", Arial, sans-serif', fontSize: '10pt', lineHeight: 1.5, color: '#333' }}>
      <style>{`
        .md-wrap { display: flex; min-height: 100vh; }
        .md-sidebar { width: 28%; background: #f3f4f6; padding: 28px 22px; }
        .md-main { width: 72%; padding: 28px 30px; }
        .md-name { font-size: 18pt; font-weight: 600; color: #111; margin-bottom: 4px; }
        .md-role { font-size: 10pt; color: #6b7280; margin-bottom: 18px; }
        .md-avatar { width: 80px; height: 80px; borderRadius: 50%; objectFit: cover; marginBottom: 10px; border: 2px solid #e5e7eb; }
        .md-contact-item { font-size: 9pt; color: #4b5563; margin-bottom: 6px; word-break: break-all; }
        .md-sidebar-section { margin-bottom: 20px; }
        .md-sidebar-title { font-size: 9.5pt; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .md-skill-bar { margin-bottom: 6px; }
        .md-skill-name { font-size: 9pt; color: #4b5563; margin-bottom: 2px; }
        .md-skill-track { height: 5px; background: #d1d5db; borderRadius: 3px; overflow: hidden; }
        .md-skill-fill { height: 100%; background: #4b563; borderRadius: 3px; }
        .md-section { margin-bottom: 16px; }
        .md-section-title { font-size: 11pt; font-weight: 700; color: #111; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
        .md-item { margin-bottom: 10px; }
        .md-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .md-item-title { font-weight: 600; color: #1f2937; }
        .md-item-date { font-size: 9pt; color: #9ca3af; white-space: nowrap; margin-left: 8px; }
        .md-item-sub { font-size: 9.5pt; color: #6b7280; margin-top: 1px; }
        .md-item-desc { margin-top: 3px; color: #4b5563; white-space: pre-line; font-size: 9.5pt; }
        .md-tech { font-size: 9pt; color: #6b7280; margin-top: 2px; }
        .md-edu-block { margin-bottom: 8px; font-size: 9pt; color: #374151; }
        .md-edu-school { font-weight: 600; }
        .md-edu-date { color: #9ca3af; }
      `}</style>

      <div className="md-wrap">
        <div className="md-sidebar">
          {basic.avatar_url && <img className="md-avatar" src={basic.avatar_url} alt="avatar" />}
          <div className="md-name">
            <PreviewEditable value={basic.name} onChange={(v) => updateBasic('name', v)} editable={editable} tag="span" />
          </div>

          <div className="md-sidebar-section">
            <div className="md-sidebar-title">Contact</div>
            {basic.email !== undefined && <div className="md-contact-item"><PreviewEditable value={basic.email} onChange={(v) => updateBasic('email', v)} editable={editable} /></div>}
            {basic.phone !== undefined && <div className="md-contact-item"><PreviewEditable value={basic.phone} onChange={(v) => updateBasic('phone', v)} editable={editable} /></div>}
            {basic.location !== undefined && <div className="md-contact-item"><PreviewEditable value={basic.location} onChange={(v) => updateBasic('location', v)} editable={editable} /></div>}
            {basic.github !== undefined && <div className="md-contact-item"><PreviewEditable value={basic.github} onChange={(v) => updateBasic('github', v)} editable={editable} /></div>}
          </div>

          {skills && (
            <div className="md-sidebar-section">
              <div className="md-sidebar-title">Skills</div>
              {editable ? (
                <div className="space-y-2">
                  {skills.languages && skills.languages.length > 0 && (
                    <div><span style={{ fontSize: '8pt', color: '#9ca3af' }}>编程语言：</span><PreviewEditable value={skills.languages.join(' · ')} onChange={(v) => updateSkills('languages', v)} editable={editable} /></div>
                  )}
                  {skills.frameworks && skills.frameworks.length > 0 && (
                    <div><span style={{ fontSize: '8pt', color: '#9ca3af' }}>框架/库：</span><PreviewEditable value={skills.frameworks.join(' · ')} onChange={(v) => updateSkills('frameworks', v)} editable={editable} /></div>
                  )}
                  {skills.tools && skills.tools.length > 0 && (
                    <div><span style={{ fontSize: '8pt', color: '#9ca3af' }}>工具/平台：</span><PreviewEditable value={skills.tools.join(' · ')} onChange={(v) => updateSkills('tools', v)} editable={editable} /></div>
                  )}
                </div>
              ) : (
                [...(skills.languages || []), ...(skills.frameworks || []), ...(skills.tools || [])].map((s, i) => (
                  <div className="md-skill-bar" key={i}>
                    <div className="md-skill-name">{s}</div>
                    <div className="md-skill-track"><div className="md-skill-fill" style={{ width: `${60 + (i * 7) % 35}%`, background: '#4b5563' }} /></div>
                  </div>
                ))
              )}
            </div>
          )}

          {education.length > 0 && (
            <div className="md-sidebar-section">
              <div className="md-sidebar-title">Education</div>
              {education.map((edu, i) => (
                <div className="md-edu-block" key={i}>
                  <div className="md-edu-school"><PreviewEditable value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} editable={editable} /></div>
                  <div><PreviewEditable value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editable={editable} /> · <PreviewEditable value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} editable={editable} /></div>
                  <div className="md-edu-date"><PreviewEditable value={edu.start || ''} onChange={(v) => updateEducation(i, 'start', v)} editable={editable} /> — <PreviewEditable value={edu.end || ''} onChange={(v) => updateEducation(i, 'end', v)} editable={editable} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md-main">
          {summary && (
            <div className="md-section">
              <div className="md-section-title">个人总结</div>
              <div className="md-item-desc">
                <PreviewEditable value={summary.text || ''} onChange={(v) => updateSummary('text', v)} editable={editable} tag="div" />
              </div>
            </div>
          )}

          {workExp.length > 0 && (
            <div className="md-section">
              <div className="md-section-title">工作经历</div>
              {workExp.map((exp, i) => (
                <div className="md-item" key={i}>
                  <div className="md-item-header">
                    <span className="md-item-title"><PreviewEditable value={exp.company} onChange={(v) => updateWork(i, 'company', v)} editable={editable} /></span>
                    <span className="md-item-date"><PreviewEditable value={exp.start || ''} onChange={(v) => updateWork(i, 'start', v)} editable={editable} /> — <PreviewEditable value={exp.end || '至今'} onChange={(v) => updateWork(i, 'end', v)} editable={editable} /></span>
                  </div>
                  <div className="md-item-sub"><PreviewEditable value={exp.title} onChange={(v) => updateWork(i, 'title', v)} editable={editable} /></div>
                  {exp.description !== undefined && <div className="md-item-desc"><PreviewEditable value={exp.description} onChange={(v) => updateWork(i, 'description', v)} editable={editable} tag="div" /></div>}
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div className="md-section">
              <div className="md-section-title">项目经历</div>
              {projects.map((proj, i) => (
                <div className="md-item" key={i}>
                  <div className="md-item-header">
                    <span className="md-item-title"><PreviewEditable value={proj.name} onChange={(v) => updateProject(i, 'name', v)} editable={editable} /></span>
                    {proj.role !== undefined && <span className="md-item-sub"><PreviewEditable value={proj.role} onChange={(v) => updateProject(i, 'role', v)} editable={editable} /></span>}
                  </div>
                  {proj.description !== undefined && <div className="md-item-desc"><PreviewEditable value={proj.description} onChange={(v) => updateProject(i, 'description', v)} editable={editable} tag="div" /></div>}
                  {proj.tech_stack && proj.tech_stack.length > 0 && (
                    <div className="md-tech">技术栈：<PreviewEditable value={proj.tech_stack.join('、')} onChange={(v) => updateProject(i, 'tech_stack', v.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean))} editable={editable} /></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
