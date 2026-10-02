import { getKaspiBoostNumber } from '@/lib/boost-payment'
import { BoostClient } from './boost-client'

export default function BoostPage() {
  return <BoostClient paymentsEnabled={getKaspiBoostNumber() !== null} />
}
