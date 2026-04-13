import PreviewEditable from './PreviewEditable'
import useTemplateEdit from './useTemplateEdit'

export default function ClassicTemplate({ sections, editable, onEdit }) {
  const { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills } = useTemplateEdit(sections, onEdit)

  return (
    <div style={{ fontFamily: '"STHeiti", "PingFang SC", Arial, sans-serif', fontSize: '10.5pt', lineHeight: 1.6, background: '#fff' }}>
      <style>{`
        .cl-header { position: relative; text-align: center; margin-bottom: 18px; border-bottom: 3px solid #111; padding-bottom: 14px; }
        .cl-header h1 { font-size: 22pt; font-weight: 700; letter-spacing: 2px; margin-bottom: 6px; }
        .cl-contact { font-size: 9.5pt; color: #333; }
        .cl-contact span { margin: 0 10px; }
        .cl-contact span:first-child { margin-left: 0; }
        .cl-section { margin-bottom: 16px; }
        .cl-section-title { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #8b0000; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 10px; }
        .cl-item { margin-bottom: 11px; }
        .cl-item-row { display: flex; justify-content: space-between; align-items: baseline; }
        .cl-item-left { font-weight: 700; font-size: 10.5pt; }
        .cl-item-right { font-size: 9.5pt; color: #555; white-space: nowrap; }
        .cl-item-sub { font-style: italic; font-size: 10pt; color: #444; margin-top: 1px; }
        .cl-item-desc { margin-top: 5px; font-size: 10pt; color: #222; white-space: pre-line; }
        .cl-skills-row { margin-bottom: 5px; font-size: 10pt; }
        .cl-skills-label { font-weight: 700; }
        .cl-skills-val { color: #333; }
        .cl-tech { font-size: 9.5pt; color: #666; margin-top: 3px; font-style: italic; }
        .cl-summary { font-size: 10pt; color: #333; line-height: 1.7; }
        .cl-avatar { position: absolute; top: 0; right: 0; width: 80px; height: 80px; borderRadius: 50%; objectFit: cover; }
      `}</style>

      <div className="cl-header">
        {basic.avatar_url && <img className="cl-avatar" src={basic.avatar_url} alt="avatar" />}
        <h1 className="cl-header">
          <PreviewEditable value={basic.name} onChange={(v) => updateBasic('name', v)} editable={editable} tag="span" />
        </h1>
        <div className="cl-contact">
          {basic.email !== undefined && <span><PreviewEditable value={basic.email} onChange={(v) => updateBasic('email', v)} editable={editable} /></span>}
          {basic.phone !== undefined && <span><PreviewEditable value={basic.phone} onChange={(v) => updateBasic('phone', v)} editable={editable} /></span>}
          {basic.location !== undefined && <span><PreviewEditable value={basic.location} onChange={(v) => updateBasic('location', v)} editable={editable} /></span>}
          {basic.linkedin !== undefined && <span><PreviewEditable value={basic.linkedin} onChange={(v) => updateBasic('linkedin', v)} editable={editable} /></span>}
          {basic.github !== undefined && <span><PreviewEditable value={basic.github} onChange={(v) => updateBasic('github', v)} editable={editable} /></span>}
        </div>
      </div>

      {summary && (
        <div className="cl-section">
          <div className="cl-section-title">Summary</div>
          <div className="cl-summary">
            <PreviewEditable value={summary.text || ''} onChange={(v) => updateSummary('text', v)} editable={editable} tag="div" />
          </div>
        </div>
      )}

      {workExp.length > 0 && (
        <div className="cl-section">
          <div className="cl-section-title">Experience</div>
          {workExp.map((exp, i) => (
            <div className="cl-item" key={i}>
              <div className="cl-item-row">
                <span className="cl-item-left"><PreviewEditable value={exp.company} onChange={(v) => updateWork(i, 'company', v)} editable={editable} /></span>
                <span className="cl-item-right"><PreviewEditable value={exp.start || ''} onChange={(v) => updateWork(i, 'start', v)} editable={editable} /> — <PreviewEditable value={exp.end || '至今'} onChange={(v) => updateWork(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="cl-item-sub"><PreviewEditable value={exp.title} onChange={(v) => updateWork(i, 'title', v)} editable={editable} /></div>
              {exp.description !== undefined && <div className="cl-item-desc"><PreviewEditable value={exp.description} onChange={(v) => updateWork(i, 'description', v)} editable={editable} tag="div" /></div>}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="cl-section">
          <div className="cl-section-title">Projects</div>
          {projects.map((proj, i) => (
            <div className="cl-item" key={i}>
              <div className="cl-item-row">
                <span className="cl-item-left"><PreviewEditable value={proj.name} onChange={(v) => updateProject(i, 'name', v)} editable={editable} /></span>
                {proj.role !== undefined && <span className="cl-item-right"><PreviewEditable value={proj.role} onChange={(v) => updateProject(i, 'role', v)} editable={editable} /></span>}
              </div>
              {proj.description !== undefined && <div className="cl-item-desc"><PreviewEditable value={proj.description} onChange={(v) => updateProject(i, 'description', v)} editable={editable} tag="div" /></div>}
              {proj.tech_stack && proj.tech_stack.length > 0 && (
                <div className="cl-tech">Tech: <PreviewEditable value={proj.tech_stack.join(' · ')} onChange={(v) => updateProject(i, 'tech_stack', v.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean))} editable={editable} /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="cl-section">
          <div className="cl-section-title">Education</div>
          {education.map((edu, i) => (
            <div className="cl-item" key={i}>
              <div className="cl-item-row">
                <span className="cl-item-left"><PreviewEditable value={edu.school} onChange={(v) => updateEducation(i, 'school', v)} editable={editable} /></span>
                <span className="cl-item-right"><PreviewEditable value={edu.start || ''} onChange={(v) => updateEducation(i, 'start', v)} editable={editable} /> — <PreviewEditable value={edu.end || ''} onChange={(v) => updateEducation(i, 'end', v)} editable={editable} /></span>
              </div>
              <div className="cl-item-sub"><PreviewEditable value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editable={editable} /> · <PreviewEditable value={edu.major} onChange={(v) => updateEducation(i, 'major', v)} editable={editable} /></div>
            </div>
          ))}
        </div>
      )}

      {skills && (
        <div className="cl-section">
          <div className="cl-section-title">Skills</div>
          {skills.languages && skills.languages.length > 0 && <div className="cl-skills-row"><span className="cl-skills-label">Languages：</span><span className="cl-skills-val"><PreviewEditable value={skills.languages.join(' · ')} onChange={(v) => updateSkills('languages', v)} editable={editable} /></span></div>}
          {skills.frameworks && skills.frameworks.length > 0 && <div className="cl-skills-row"><span className="cl-skills-label">Frameworks：</span><span className="cl-skills-val"><PreviewEditable value={skills.frameworks.join(' · ')} onChange={(v) => updateSkills('frameworks', v)} editable={editable} /></span></div>}
          {skills.tools && skills.tools.length > 0 && <div className="cl-skills-row"><span className="cl-skills-label">Tools：</span><span className="cl-skills-val"><PreviewEditable value={skills.tools.join(' · ')} onChange={(v) => updateSkills('tools', v)} editable={editable} /></span></div>}
        </div>
      )}
    </div>
  )
}
