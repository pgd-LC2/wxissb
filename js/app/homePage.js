import { loadTemplates, cloneTemplate } from '../ui/runtime/mount.js';
import { GameApp } from '../legacy/context.js';

async function bootHome(mountEl) {
  mountEl.textContent = '';
  await loadTemplates(['/templates/homeShell.html']);
  mountEl.appendChild(cloneTemplate('tpl-home-shell'));
  await import('../legacy/installHome.js');
  GameApp.HomePage?.init?.();
}

bootHome(document.getElementById('app')).catch((error) => {
  console.error('主页加载失败', error);
});
