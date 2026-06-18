import type { CatchApi } from '@shared/types'

declare global {
  interface Window {
    catch: CatchApi
  }
}

export {}
