import { RegistriSection } from '@/components/registri/registri-section';
import { BrogliaccioSection } from './components/brogliaccio-section';

export default function Home() {
  return (
    <div className="space-y-8">
      <BrogliaccioSection />
      <RegistriSection />
    </div>
  );
} 