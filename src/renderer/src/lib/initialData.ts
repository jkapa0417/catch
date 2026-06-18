import type { Note, Project } from '@shared/types'
import { rid } from './notes'

/**
 * Fresh-install state. New users start empty — a single untitled note in one
 * default project — never the demo content. The app keeps the invariant that at
 * least one note always exists (the capture pane always has an active note).
 */

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyNote(projectId: string): Note {
  return { id: 'x' + rid(), projectId, mode: 'meeting', title: '', date: todayStr(), items: [] }
}

export function defaultProjects(): Project[] {
  return [{ id: 'p' + rid(), name: { ko: '내 노트', en: 'My Notes' } }]
}

export function initialState(): { projects: Project[]; notes: Note[]; activeId: string } {
  const projects = defaultProjects()
  const note = emptyNote(projects[0].id)
  return { projects, notes: [note], activeId: note.id }
}
