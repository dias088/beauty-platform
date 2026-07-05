'use server'

import { getMastersByIds } from '@/lib/queries/masters'

export async function getMastersByIdsAction(ids: string[]) {
  return getMastersByIds(ids)
}
