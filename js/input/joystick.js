(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { joystickEl, joyKnob } = GameApp.DOM;
  const { hypot } = GameApp.Deps.utils;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  // Joystick pointer control
  let joyActive = false;
  let joyPointerId = null;
  let joyCenter = { x: 0, y: 0 };

  // 动态获取摇杆半径（基于元素实际大小）
  function getJoyRadius() {
    if (!joystickEl) return 70;
    const rect = joystickEl.getBoundingClientRect();
    return rect.width / 2;
  }

  // 动态获取手柄大小（基于 joyKnob 实际大小）
  function getKnobSize() {
    if (!joyKnob) return 22;
    const rect = joyKnob.getBoundingClientRect();
    return rect.width / 2;
  }

  function setJoyKnob(dx, dy) {
    const joyRadius = getJoyRadius();
    const knobSize = getKnobSize();
    const maxMove = joyRadius - knobSize;
    const px = dx * maxMove;
    const py = dy * maxMove;
    joyKnob.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
  }

  if (joystickEl) {
    joystickEl.addEventListener("pointerdown", (e) => {
      joyActive = true;
      joyPointerId = e.pointerId;
      joystickEl.setPointerCapture(joyPointerId);

      const rect = joystickEl.getBoundingClientRect();
      joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setJoyKnob(0, 0);
    });

    joystickEl.addEventListener("pointermove", (e) => {
      if (!joyActive || e.pointerId !== joyPointerId) return;
      const dx = e.clientX - joyCenter.x;
      const dy = e.clientY - joyCenter.y;
      const dist = hypot(dx, dy);
      if (dist <= 0.0001) {
        if (game) game.joystickVector = { dx: 0, dy: 0 };
        setJoyKnob(0, 0);
        return;
      }
      const joyRadius = getJoyRadius();
      const factor = Math.min(dist, joyRadius) / dist;
      const ndx = (dx * factor) / joyRadius;
      const ndy = (dy * factor) / joyRadius;
      if (game) game.joystickVector = { dx: ndx, dy: ndy };
      setJoyKnob(ndx, ndy);
    });

    function endJoy(e) {
      if (!joyActive) return;
      joyActive = false;
      joyPointerId = null;
      if (game) game.joystickVector = { dx: 0, dy: 0 };
      setJoyKnob(0, 0);
      try { joystickEl.releasePointerCapture(e.pointerId); } catch {}
    }

    joystickEl.addEventListener("pointerup", endJoy);
    joystickEl.addEventListener("pointercancel", endJoy);
    joystickEl.addEventListener("pointerleave", endJoy);
  }

  const input = GameApp.Input = GameApp.Input || {};
  input.isJoyActive = () => joyActive;
  input.setJoyKnob = setJoyKnob;
})();
