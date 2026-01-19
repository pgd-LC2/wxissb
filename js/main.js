(() => {
  "use strict";

  async function init() {
    // 初始化桌面端摇杆设置
    if (window.GameApp && window.GameApp.JoystickDialog && window.GameApp.JoystickDialog.initJoystickForDesktop) {
      await window.GameApp.JoystickDialog.initJoystickForDesktop();
    }

    // 启动游戏
    if (window.GameApp && window.GameApp.Boot && window.GameApp.Boot.start) {
      window.GameApp.Boot.start();
    }
  }

  init();
})();
