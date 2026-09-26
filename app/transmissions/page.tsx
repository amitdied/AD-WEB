import type { Metadata } from 'next';
import { INSTAGRAM_TRANSMISSIONS } from '@/lib/data';
import { TransmissionsClient } from './TransmissionsClient';

export const metadata: Metadata = {
  title: 'CCTV Transmissions // AMITDIED',
  description: 'Live studio surveillance feed, analog synthesizer cookups, placements, and transmissions from @amitdied on Instagram.',
};

export default function TransmissionsPage() {
  return <TransmissionsClient initialData={INSTAGRAM_TRANSMISSIONS} />;
}
