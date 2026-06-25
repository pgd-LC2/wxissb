import { loadTemplates, cloneTemplate } from '../ui/runtime/mount.js';
import { createServices } from '../platform/services.js';
import { GameApp } from '../legacy/context.js';

async function bootLeaderboard(mountEl) {
  createServices({ page: 'leaderboard' });
  mountEl.textContent = '';
  await loadTemplates(['/assets/templates/leaderboardShell.html']);
  mountEl.appendChild(cloneTemplate('tpl-leaderboard-shell'));
  await import('../legacy/installLeaderboard.js');
  GameApp.LeaderboardPage?.init?.();
}

bootLeaderboard(document.getElementById('app')).catch((error) => {
  console.error('排行榜页面启动失败', error);
});
