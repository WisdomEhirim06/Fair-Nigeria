import { PageChrome } from '@/components/app/PageChrome';
import { SheetDetail } from '@/components/sheets/SheetDetail';

// A single result sheet: the paper, its fingerprint, and the figures read from it.
export default function SheetPage() {
  return (
    <PageChrome>
      <SheetDetail />
    </PageChrome>
  );
}
