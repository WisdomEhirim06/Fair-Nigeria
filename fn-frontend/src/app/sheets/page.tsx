import { PageChrome } from '@/components/app/PageChrome';
import { SheetsBrowser } from '@/components/sheets/SheetsBrowser';

// Public paper trail — browse the EC8A sheets behind the count.
export default function SheetsPage() {
  return (
    <PageChrome>
      <SheetsBrowser />
    </PageChrome>
  );
}
