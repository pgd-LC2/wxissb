import { loadTemplates, cloneTemplate } from '../ui/runtime/mount.js';
import { GameApp } from '../legacy/context.js';

async function bootLeaderboard(mountEl) {
  mountEl.textContent = '';
  await loadTemplates(['/templates/leaderboardShell.html']);
  mountEl.appendChild(cloneTemplate('tpl-leaderboard-shell'));
  await import('../legacy/installLeaderboard.js');
  GameApp.LeaderboardPage?.init?.();
}

bootLeaderboard(document.getElementById('app')).catch((error) => {
  console.error('排行榜页面加载失败', error);
});
