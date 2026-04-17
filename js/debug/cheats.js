export function isSpeedSkill(skill) {
  const name = skill?.name || '';
  const desc = skill?.description || '';
  if (name.includes('疾风') || name.includes('移速') || name.includes('速度')) return true;
  if (desc.includes('移动速度') || desc.includes('移速')) return true;
  return false;
}

export function applyGodMode(world) {
  if (!world) return '游戏未启动，无法开挂';
  const allSkills = world.allSkills || [];
  world.nbModeActive = true;
  for (const skill of allSkills) {
    if (world.acquiredSkills?.includes(skill.name)) continue;
    if (isSpeedSkill(skill)) continue;
    if (typeof skill.effect === 'function') {
      try {
        skill.effect(world);
        world.acquiredSkills = world.acquiredSkills || [];
        world.acquiredSkills.push(skill.name);
      } catch {}
    }
  }
  world.updateUI?.();
  return 'NB Mode Activated';
}
