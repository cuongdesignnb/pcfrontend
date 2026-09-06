import type { BuilderDraft, BuilderSelection } from '~/types/pc-builder'

const DRAFT_KEY = 'pc_builder_draft'
const PENDING_SAVE_KEY = 'pc_builder_pending_save'

export const useBuilderPersistence = () => {
  const readDraft = (): BuilderDraft | null => {
    if (!import.meta.client) return null

    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const draft = JSON.parse(raw) as Partial<BuilderDraft>
      if (draft.version !== 1 || !draft.build || typeof draft.build !== 'object') return null
      return { version: 1, build: { ...draft.build } }
    } catch {
      return null
    }
  }

  const saveDraft = (build: BuilderSelection) => {
    if (!import.meta.client) return
    const draft: BuilderDraft = { version: 1, build: { ...build } }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }

  const clearDraft = () => {
    if (!import.meta.client) return
    localStorage.removeItem(DRAFT_KEY)
  }

  const savePendingBuild = (build: BuilderSelection) => {
    if (!import.meta.client) return
    sessionStorage.setItem(PENDING_SAVE_KEY, JSON.stringify({ version: 1, build: { ...build } }))
    saveDraft(build)
  }

  const readPendingBuild = (): BuilderSelection | null => {
    if (!import.meta.client) return null
    try {
      const raw = sessionStorage.getItem(PENDING_SAVE_KEY)
      if (!raw) return null
      const value = JSON.parse(raw) as { version?: number; build?: BuilderSelection }
      return value.version === 1 && value.build ? { ...value.build } : null
    } catch {
      return null
    }
  }

  const clearPendingBuild = () => {
    if (!import.meta.client) return
    sessionStorage.removeItem(PENDING_SAVE_KEY)
  }

  return {
    readDraft,
    saveDraft,
    clearDraft,
    savePendingBuild,
    readPendingBuild,
    clearPendingBuild,
  }
}
