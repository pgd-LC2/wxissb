import { GameApp as __GameApp } from './legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
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

(() => {
  "use strict";

  const GameApp = __GameApp;

  // 检测是否为桌面设备（非触摸设备）
  function isDesktopDevice() {
    // 检测是否支持精细指针（鼠标）且支持悬停
    const hasMousePointer = window.matchMedia("(pointer: fine)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;
    
    // 检测是否为触摸设备
    const isTouchDevice = ('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0) || 
                          (navigator.msMaxTouchPoints > 0);
    
    // 桌面设备：有鼠标指针、支持悬停、且不是主要触摸设备
    return hasMousePointer && canHover && !isTouchDevice;
  }

  // 显示摇杆对话框
  function showJoystickDialog() {
    return new Promise((resolve) => {
      // 创建对话框HTML
      const dialogHTML = `
        <div id="joystickDialog" style="
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          animation: fadeIn 0.3s ease-out;
        ">
          <div style="
            width: min(480px, 100%);
            background: rgba(20,20,20,0.95);
            border: 2px solid rgba(255,255,255,0.15);
            border-radius: 20px;
            padding: 32px;
            box-sizing: border-box;
            animation: slideIn 0.4s ease-out;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          ">
            <h2 style="
              margin: 0 0 16px 0;
              font-size: 28px;
              text-align: center;
              color: #ffffff;
              font-weight: 900;
              letter-spacing: 0.5px;
            ">🎮 摇杆设置</h2>
            
            <p style="
              margin: 0 0 28px 0;
              text-align: center;
              color: rgba(255,255,255,0.75);
              font-size: 16px;
              line-height: 1.5;
            ">是否需要显示虚拟摇杆？</p>
            
            <div style="
              display: flex;
              gap: 12px;
              justify-content: center;
            ">
              <button id="joystickYes" style="
                flex: 1;
                padding: 14px 24px;
                border-radius: 12px;
                border: none;
                background: linear-gradient(135deg, #34c759, #30d158);
                color: #ffffff;
                font-weight: 900;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(52,199,89,0.4);
              ">显示摇杆</button>
              
              <button id="joystickNo" style="
                flex: 1;
                padding: 14px 24px;
                border-radius: 12px;
                border: 2px solid rgba(255,255,255,0.2);
                background: rgba(255,255,255,0.08);
                color: #ffffff;
                font-weight: 900;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
              ">不需要</button>
            </div>
            
            <p style="
              margin: 20px 0 0 0;
              text-align: center;
              color: rgba(255,255,255,0.5);
              font-size: 13px;
            ">💡 提示：您也可以使用 W/A/S/D 键盘控制</p>
          </div>
        </div>
        
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { 
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          #joystickYes:hover {
            background: linear-gradient(135deg, #30d158, #34c759);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(52,199,89,0.5);
          }
          
          #joystickNo:hover {
            background: rgba(255,255,255,0.12);
            border-color: rgba(255,255,255,0.3);
          }
          
          #joystickYes:active,
          #joystickNo:active {
            transform: translateY(0);
          }
        </style>
      `;

      // 插入对话框到页面
      const dialogContainer = document.createElement('div');
      dialogContainer.innerHTML = dialogHTML;
      document.body.appendChild(dialogContainer);

      const dialog = document.getElementById('joystickDialog');
      const yesBtn = document.getElementById('joystickYes');
      const noBtn = document.getElementById('joystickNo');

      // 处理用户选择
      function handleChoice(showJoystick) {
        // 不再保存用户选择到 localStorage，实现每次都询问
        // localStorage.setItem('desktopJoystickPreference', showJoystick ? 'yes' : 'no');
        
        // 淡出动画
        dialog.style.animation = 'fadeOut 0.3s ease-out';
        dialog.style.opacity = '0';
        
        setTimeout(() => {
          dialogContainer.remove();
          resolve(showJoystick);
        }, 300);
      }

      yesBtn.addEventListener('click', () => handleChoice(true));
      noBtn.addEventListener('click', () => handleChoice(false));

      // 添加淡出动画
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    });
  }

  // 初始化摇杆设置
  async function initJoystickForDesktop() {
    const joystickEl = document.getElementById('joystick');
    if (!joystickEl) return;

    /* 移除设备检测，在任何设备上都进行询问
    // 如果不是桌面设备，使用默认行为（CSS媒体查询控制）
    if (!isDesktopDevice()) {
      return;
    }
    */

    // 每次都显示对话框询问用户
    const showJoystick = await showJoystickDialog();

    // 根据用户选择显示或隐藏摇杆
    if (showJoystick) {
      // 显示摇杆，并使用更大的尺寸
      joystickEl.style.display = 'block';
      joystickEl.classList.add('desktop-joystick');
      
      // 为桌面端添加更大的摇杆样式
      const style = document.createElement('style');
      style.id = 'desktopJoystickStyle';
      style.textContent = `
        #joystick.desktop-joystick {
          width: 220px !important;
          height: 220px !important;
          left: 4vw;
          bottom: 4vw;
        }
        
        #joystick.desktop-joystick #joyKnob {
          width: 70px !important;
          height: 70px !important;
        }
        
        #joystick.desktop-joystick #joyBase {
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
      `;
      // 避免重复添加样式
      if (!document.getElementById('desktopJoystickStyle')) {
          document.head.appendChild(style);
      }
    } else {
      // 不显示摇杆
      joystickEl.style.display = 'none';
    }
  }

  // 导出到 GameApp
  GameApp.JoystickDialog = {
    isDesktopDevice,
    showJoystickDialog,
    initJoystickForDesktop
  };
})();

(() => {
  "use strict";

  const GameApp = __GameApp;
  const { hypot } = GameApp.Deps.utils;
  const { SFX } = GameApp.Deps;

  let game = null;
  GameApp.Runtime.onGameChange((g) => { game = g; });

  const keys = new Set();
  function recomputeKeyVector() {
    let dx = 0, dy = 0;
    if (keys.has("w")) dy -= 1;
    if (keys.has("s")) dy += 1;
    if (keys.has("a")) dx -= 1;
    if (keys.has("d")) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }

  window.addEventListener("keydown", (e) => {
    // 如果焦点在输入框中，完全不处理，让浏览器默认行为处理输入
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return; // 直接返回，不阻止任何默认行为
    }

    const k = e.key.toLowerCase();

    // unlock audio on user gesture (autoplay policies)
    SFX.unlock();

    // toggle mute
    if (k === "m") {
      SFX.setMuted(!SFX.isMuted());
      const ui = GameApp.UI;
      if (ui && ui.refreshSoundIcon) ui.refreshSoundIcon();
      e.preventDefault();
      return;
    }

    if (["w", "a", "s", "d"].includes(k)) {
      keys.add(k);
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener("keyup", (e) => {
    // 如果焦点在输入框中，完全不处理
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return; // 直接返回，不阻止任何默认行为
    }

    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) {
      keys.delete(k);
      e.preventDefault();
    }
  }, { passive: false });

  function clearMovementInputs() {
    keys.clear();
    if (game) game.joystickVector = { dx: 0, dy: 0 };
    const input = GameApp.Input;
    if (input && input.setJoyKnob) input.setJoyKnob(0, 0);
  }
  window.addEventListener("blur", clearMovementInputs);
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearMovementInputs(); });

  const input = GameApp.Input = GameApp.Input || {};
  input.recomputeKeyVector = recomputeKeyVector;
  input.clearMovementInputs = clearMovementInputs;
})();
