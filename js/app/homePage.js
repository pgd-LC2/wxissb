import { loadTemplates, cloneTemplate } from '../ui/runtime/mount.js';
import { createServices } from '../platform/services.js';
import { GameApp } from '../legacy/context.js';

async function bootHome(mountEl) {
  createServices({ page: 'home' });
  mountEl.textContent = '';
  await loadTemplates([new URL('../../assets/templates/homeShell.html', import.meta.url).href]);
  mountEl.appendChild(cloneTemplate('tpl-home-shell'));
  await import('../legacy/installHome.js');
  GameApp.HomePage?.init?.();
}

bootHome(document.getElementById('app')).catch((error) => {
  console.error('主页启动失败', error);
});
