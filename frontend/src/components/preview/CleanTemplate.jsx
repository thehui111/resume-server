import PreviewEditable from './PreviewEditable'
import useTemplateEdit from './useTemplateEdit'

export default function CleanTemplate({ sections, editable, onEdit }) {
  const { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills } = useTemplateEdit(sections, onEdit)

  return (
    <div style={{ fontFamily: '"NotoSansSC", "PingFang SC", Arial, sans-serif', fontSize: '10.5pt', lineHeight: 1.55, color: '#334', background: '#fff' }}>
      <style>{`
        .cl2-header { text-align: center; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
        .cl2-header h1 { font-size: 20pt; font-weight: 500; color: #1f2937; margin-bottom: 8px; }
        .cl2-contact { font-size: 9.5pt; color: #6b7280; }
        .cl2-contact span { margin: 0 8px; }
        .cl2-avatar { width: 72px; height: 72px; borderRadius: 50%; objectFit: cover; marginBottom: 10px; border: 2px solid #e5e7eb; }
        .cl2-section { margin-bottom: 18px; padding: 14px 16px; background: #fafafa; borderRadius: 8px; }
        .cl2-section-title { font-size: 10.5pt; font-weight: 600; color: #4f46e5; margin-bottom: 10px; letterSpacing: 0.5px; }
        .cl2-summary { color: #4b5563; }
        .cl2-item { margin-bottom: 10px; }
        .cl2-item:last-child { margin-bottom: 0; }
        .cl2-item-row { display: flex; justify-content: space-between; align-items: baseline; }
        .cl2-item-title { font-weight: 600; color: #374151; }
        .cl2-item-sub { font-size: 9.5pt; color: #6b7280; margin-top: 2px; }
        .cl2-item-date { font-size: 9pt; color: #9ca3af; white-space: nowrap; margin-left: 8px; }
        .cl2-item-desc { margin-top: 4px; color: #4b5563; white-space: pre-line; font-size: 10pt; }
        .cl2-skills-row { margin-bottom: 5px; font-size: 10pt; }
        .cl2-skills-label { font-weight: 600; color: #374151; display: inline; }
        .cl2-skills-val { color: #4b5563; display: inline; }
        .cl2-tech { font-size: 9pt; color: #6b7280; margin-top: 3px; }
      `}</style>

      <div className="cl2-header">
        {basic.avatar_url && <img className="cl2-avatar" src={basic.avatar_url} alt="avatar" />}
        <h1 className="cl2-header">
          <PreviewEditable value={basic.name} onChange={(v) => updateBasic('name', v)} editable={editable} tag="span" />
        </h1>
        <div className="cl2-contact">
          {basic.email !== undefined && <span><PreviewEditable value={basic.email} onChange={(v) => updateBasic('email', v)} editable={editable} /></span>}
          {basic.phone !== undefined && <span><PreviewEditable value={basic.phone} onChange={(v) => updateBasic('phone', v)} editable={editable} /></span>}
          {basic.location !== undefined && <span><PreviewEditable value={basic.location} onChange={(v) => updateBasic('location', v)} editable={editable} /></span>}
        </div>
      </div>

      {summary && (
        <div className="cl2-section">
          <div className="cl2-section-title">个人总结</div>
          <div className="cl2-summary cl2-item-desc">
            <PreviewEditable value={summary.text || ''} onChange={(v) => updateSummary('text', v)} editable={editable} tag="div" />
          </div>
        </div>
      )}

      {workExp.length > 0 && (
        <div className="cl2-section">
          <div className="cl2-section-title">工作经历</div>
          {workExp.map((exp, i) => (
            <div className="cl2-item" key={i}>
              <div className="cl2-item-row">
                <span className="cl2-item-title"><PreviewEditable value={exp.company} onChange={(v) => updateWork(i, 'company', v)} editable={editable} /></span>
                <span className="cl2-item-date"><PreviewEditable value={exp.start || ''} onChange={(v) => updateWork(i, 'start', v)} editable={editable} /> — <PreviewEditable value={exp.end || '至今'} onChange={(v) => updateWork(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="cl2-item-sub"><PreviewEditable value={exp.title} onChange={(v) => updateWork(i, 'title', v)} editable={editable} /></div>
              {exp.description !== undefined && <div className="cl2-item-desc"><PreviewEditable value={exp.description} onChange={(v) => updateWork(i, 'description', v)} editable={editable} tag="div" /></div>}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="cl2-section">
          <div className="cl2-section-title">项目经历</div>
          {projects.map((proj, i) => (
            <div className="cl2-item" key={i}>
              <div className="cl2-item-row">
                <span className="cl2-item-title"><PreviewEditable value={proj.name} onChange={(v) => updateProject(i, 'name', v)} editable={editable} /></span>
                {proj.role !== undefined && <span className="cl2-item-sub"><PreviewEditable value={proj.role} onChange={(v) => updateProject(i, 'role', v)} editable={editable} /></span>}
              </div>
              {proj.description !== undefined && <div className="cl2-item-desc"><PreviewEditable value={proj.description} onChange={(v) => updateProject(i, 'description', v)} editable={editable} tag="div" /></div>}
              {proj.tech_stack && proj.tech_stack.length > 0 && (
                <div className="cl2-tech">技术栈：<PreviewEditable value={proj.tech_stack.join('、')} onChange={(v) => updateProject(i, 'tech_stack', v.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean))} editable={editable} /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="cl2-section">
          <div className="cl2-section-title">教育背景</div>
          {education.map((edu, i) => (
            <div className="cl2-item" key={i}>
              <div className="cl2-item-row">
                <span className="cl2-item-title"><PreviewEditable value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} editable={editable} /></span>
                <span className="cl2-item-date"><PreviewEditable value={edu.start || ''} onChange={(v) => updateEducation(i, 'start', v)} editable={editable} /> — <PreviewEditable value={edu.end || ''} onChange={(v) => updateEducation(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="cl2-item-sub"><PreviewEditable value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editable={editable} /> · <PreviewEditable value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} editable={editable} /></div>
            </div>
          ))}
        </div>
      )}

      {skills && (
        <div className="cl2-section">
          <div className="cl2-section-title">技能</div>
          {skills.languages && skills.languages.length > 0 && <div className="cl2-skills-row"><span className="cl2-skills-label">编程语言：</span><span className="cl2-skills-val"><PreviewEditable value={skills.languages.join('、')} onChange={(v) => updateSkills('languages', v)} editable={editable} /></span></div>}
          {skills.frameworks && skills.frameworks.length > 0 && <div className="cl2-skills-row"><span className="cl2-skills-label">框架/库：</span><span className="cl2-skills-val"><PreviewEditable value={skills.frameworks.join('、')} onChange={(v) => updateSkills('frameworks', v)} editable={editable} /></span></div>}
          {skills.tools && skills.tools.length > 0 && <div className="cl2-skills-row"><span className="cl2-skills-label">工具/平台：</span><span className="cl2-skills-val"><PreviewEditable value={skills.tools.join('、')} onChange={(v) => updateSkills('tools', v)} editable={editable} /></span></div>}
        </div>
      )}
    </div>
  )
}
