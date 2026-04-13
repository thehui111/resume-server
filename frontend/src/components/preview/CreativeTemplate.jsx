import PreviewEditable from './PreviewEditable'
import useTemplateEdit from './useTemplateEdit'

export default function CreativeTemplate({ sections, editable, onEdit }) {
  const { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills } = useTemplateEdit(sections, onEdit)

  const allSkills = [...(skills.languages || []), ...(skills.frameworks || []), ...(skills.tools || [])]

  return (
    <div style={{ fontFamily: '"NotoSansSC", "PingFang SC", Arial, sans-serif', fontSize: '10pt', lineHeight: 1.55, color: '#2d3748' }}>
      <style>{`
        .cr-wrap { display: flex; min-height: 100vh; }
        .cr-sidebar { width: 30%; background: #2d3748; color: #e2e8f0; padding: 32px 24px; }
        .cr-main { width: 70%; padding: 32px 28px; }
        .cr-name { font-size: 18pt; font-weight: 600; color: #fff; margin-bottom: 6px; }
        .cr-avatar { width: 80px; height: 80px; borderRadius: 50%; objectFit: cover; marginBottom: 12px; border: 2px solid rgba(255,255,255,0.25); }
        .cr-contact-block { margin-top: 20px; font-size: 9pt; color: #cbd5e1; }
        .cr-contact-block div { margin-bottom: 6px; word-break: break-all; }
        .cr-sidebar-section { margin-top: 22px; }
        .cr-sidebar-title { font-size: 9.5pt; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #4a5568; padding-bottom: 4px; }
        .cr-skill-pill { display: inline-block; background: #4a5568; color: #e2e8f0; font-size: 8.5pt; padding: 3px 8px; borderRadius: 3px; margin: 0 4px 4px 0; }
        .cr-section { margin-bottom: 18px; }
        .cr-section-title { font-size: 11pt; font-weight: 700; color: #2d3748; border-left: 3px solid #2d3748; padding-left: 8px; margin-bottom: 10px; }
        .cr-item { margin-bottom: 10px; }
        .cr-item-header { display: flex; justify-content: space-between; align-items: baseline; }
        .cr-item-title { font-weight: 600; color: #1a202c; }
        .cr-item-date { font-size: 9pt; color: #718096; white-space: nowrap; margin-left: 8px; }
        .cr-item-sub { font-size: 9.5pt; color: #4a5568; margin-top: 1px; }
        .cr-item-desc { margin-top: 3px; color: #4a5568; white-space: pre-line; font-size: 9.5pt; }
        .cr-tech { font-size: 9pt; color: #718096; margin-top: 2px; }
        .cr-edu-block { margin-bottom: 10px; font-size: 9pt; color: #e2e8f0; }
        .cr-edu-school { font-weight: 600; }
        .cr-edu-date { color: #a0aec0; }
      `}</style>

      <div className="cr-wrap">
        <div className="cr-sidebar">
          {basic.avatar_url && <img className="cr-avatar" src={basic.avatar_url} alt="avatar" />}
          <div className="cr-name">
            <PreviewEditable value={basic.name} onChange={(v) => updateBasic('name', v)} editable={editable} tag="span" />
          </div>

          <div className="cr-contact-block">
            {basic.email !== undefined && <div><PreviewEditable value={basic.email} onChange={(v) => updateBasic('email', v)} editable={editable} /></div>}
            {basic.phone !== undefined && <div><PreviewEditable value={basic.phone} onChange={(v) => updateBasic('phone', v)} editable={editable} /></div>}
            {basic.location !== undefined && <div><PreviewEditable value={basic.location} onChange={(v) => updateBasic('location', v)} editable={editable} /></div>}
            {basic.github !== undefined && <div><PreviewEditable value={basic.github} onChange={(v) => updateBasic('github', v)} editable={editable} /></div>}
          </div>

          {allSkills.length > 0 && (
            <div className="cr-sidebar-section">
              <div className="cr-sidebar-title">Skills</div>
              {editable ? (
                <div>
                  {skills.languages && skills.languages.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '8pt', color: '#a0aec0' }}>编程语言：</span>
                      <PreviewEditable value={skills.languages.join('、')} onChange={(v) => updateSkills('languages', v)} editable={editable} />
                    </div>
                  )}
                  {skills.frameworks && skills.frameworks.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '8pt', color: '#a0aec0' }}>框架/库：</span>
                      <PreviewEditable value={skills.frameworks.join('、')} onChange={(v) => updateSkills('frameworks', v)} editable={editable} />
                    </div>
                  )}
                  {skills.tools && skills.tools.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '8pt', color: '#a0aec0' }}>工具/平台：</span>
                      <PreviewEditable value={skills.tools.join('、')} onChange={(v) => updateSkills('tools', v)} editable={editable} />
                    </div>
                  )}
                </div>
              ) : (
                allSkills.map((s, i) => <span className="cr-skill-pill" key={i}>{s}</span>)
              )}
            </div>
          )}

          {education.length > 0 && (
            <div className="cr-sidebar-section">
              <div className="cr-sidebar-title">Education</div>
              {education.map((edu, i) => (
                <div className="cr-edu-block" key={i}>
                  <div className="cr-edu-school"><PreviewEditable value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} editable={editable} /></div>
                  <div><PreviewEditable value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editable={editable} /> · <PreviewEditable value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} editable={editable} /></div>
                  <div className="cr-edu-date"><PreviewEditable value={edu.start || ''} onChange={(v) => updateEducation(i, 'start', v)} editable={editable} /> — <PreviewEditable value={edu.end || ''} onChange={(v) => updateEducation(i, 'end', v)} editable={editable} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cr-main">
          {summary && (
            <div className="cr-section">
              <div className="cr-section-title">个人总结</div>
              <div className="cr-item-desc">
                <PreviewEditable value={summary.text || ''} onChange={(v) => updateSummary('text', v)} editable={editable} tag="div" />
              </div>
            </div>
          )}

          {workExp.length > 0 && (
            <div className="cr-section">
              <div className="cr-section-title">工作经历</div>
              {workExp.map((exp, i) => (
                <div className="cr-item" key={i}>
                  <div className="cr-item-header">
                    <span className="cr-item-title"><PreviewEditable value={exp.company} onChange={(v) => updateWork(i, 'company', v)} editable={editable} /></span>
                    <span className="cr-item-date"><PreviewEditable value={exp.start || ''} onChange={(v) => updateWork(i, 'start', v)} editable={editable} /> — <PreviewEditable value={exp.end || '至今'} onChange={(v) => updateWork(i, 'end', v)} editable={editable} /></span>
                  </div>
                  <div className="cr-item-sub"><PreviewEditable value={exp.title} onChange={(v) => updateWork(i, 'title', v)} editable={editable} /></div>
                  {exp.description !== undefined && <div className="cr-item-desc"><PreviewEditable value={exp.description} onChange={(v) => updateWork(i, 'description', v)} editable={editable} tag="div" /></div>}
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div className="cr-section">
              <div className="cr-section-title">项目经历</div>
              {projects.map((proj, i) => (
                <div className="cr-item" key={i}>
                  <div className="cr-item-header">
                    <span className="cr-item-title"><PreviewEditable value={proj.name} onChange={(v) => updateProject(i, 'name', v)} editable={editable} /></span>
                    {proj.role !== undefined && <span className="cr-item-sub"><PreviewEditable value={proj.role} onChange={(v) => updateProject(i, 'role', v)} editable={editable} /></span>}
                  </div>
                  {proj.description !== undefined && <div className="cr-item-desc"><PreviewEditable value={proj.description} onChange={(v) => updateProject(i, 'description', v)} editable={editable} tag="div" /></div>}
                  {proj.tech_stack && proj.tech_stack.length > 0 && (
                    <div className="cr-tech">技术栈：<PreviewEditable value={proj.tech_stack.join('、')} onChange={(v) => updateProject(i, 'tech_stack', v.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean))} editable={editable} /></div>
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
