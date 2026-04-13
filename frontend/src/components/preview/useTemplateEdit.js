import { useCallback } from 'react'

export default function useTemplateEdit(sections, onEdit) {
  const basic = sections?.basic_info || {}
  const summary = sections?.summary || {}
  const workExp = sections?.work_exp || []
  const projects = sections?.projects || []
  const education = sections?.education || []
  const skills = sections?.skills || {}

  const updateBasic = useCallback((field, value) => {
    onEdit?.('basic_info', { ...basic, [field]: value })
  }, [basic, onEdit])

  const updateSummary = useCallback((field, value) => {
    onEdit?.('summary', { ...summary, [field]: value })
  }, [summary, onEdit])

  const updateWork = useCallback((index, field, value) => {
    const list = [...workExp]
    list[index] = { ...list[index], [field]: value }
    onEdit?.('work_exp', list)
  }, [workExp, onEdit])

  const updateProject = useCallback((index, field, value) => {
    const list = [...projects]
    list[index] = { ...list[index], [field]: value }
    onEdit?.('projects', list)
  }, [projects, onEdit])

  const updateEducation = useCallback((index, field, value) => {
    const list = [...education]
    list[index] = { ...list[index], [field]: value }
    onEdit?.('education', list)
  }, [education, onEdit])

  const updateSkills = useCallback((field, value) => {
    const arr = value.split(/\s*[·、,]\s*|\s*,\s*/).filter(Boolean)
    onEdit?.('skills', { ...skills, [field]: arr })
  }, [skills, onEdit])

  return { basic, summary, workExp, projects, education, skills, updateBasic, updateSummary, updateWork, updateProject, updateEducation, updateSkills }
}
