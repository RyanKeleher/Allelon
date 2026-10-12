import { choose, confirm, errorMessage, notify } from './dialogs';
import { REPORT_REASONS, useBlock, useReport, type ReportTarget } from './queries/safety';

/**
 * Report / block actions shared by request cards, responses, and profiles.
 * Reporting is anonymous to the person reported; blocking is silent.
 */
export function useSafetyMenu() {
  const report = useReport();
  const block = useBlock();

  async function reportFlow(targetType: ReportTarget, targetId: string) {
    const reason = await choose(
      'Report',
      'Why are you reporting this? Your report is private.',
      REPORT_REASONS.map((r) => ({ key: r.key, label: r.label })),
    );
    if (!reason) return;
    try {
      await report.mutateAsync({ targetType, targetId, reason });
      notify(
        'Thank you for telling us',
        reason === 'self_harm'
          ? 'Our team will review this. If you think someone is in immediate danger, please contact local emergency services.'
          : 'Our team will review this.',
      );
    } catch (e) {
      notify('Could not send the report', errorMessage(e));
    }
  }

  async function blockFlow(userId: string, name: string) {
    const ok = await confirm(
      `Block ${name}?`,
      'They won’t be able to see your requests or respond to you, and you won’t see theirs. They aren’t told.',
      'Block',
      { destructive: true },
    );
    if (!ok) return;
    try {
      await block.mutateAsync({ userId, block: true });
    } catch (e) {
      notify('Could not block', errorMessage(e));
    }
  }

  return {
    async open(opts: { targetType: ReportTarget; targetId: string; authorId?: string | null; authorName?: string | null }) {
      const action = await choose('More', undefined, [
        { key: 'report' as const, label: 'Report', destructive: true },
        ...(opts.authorId ? [{ key: 'block' as const, label: `Block ${opts.authorName ?? 'this person'}`, destructive: true }] : []),
      ]);
      if (action === 'report') await reportFlow(opts.targetType, opts.targetId);
      if (action === 'block' && opts.authorId) await blockFlow(opts.authorId, opts.authorName ?? 'this person');
    },
    reportFlow,
    blockFlow,
  };
}
