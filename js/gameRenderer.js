import { GameApp as __GameApp } from './legacy/context.js';
(() => {
  "use strict";

  const GameApp = __GameApp;
  const RenderSystems = GameApp.RenderSystems = GameApp.RenderSystems || {};

  function attachRenderer(game) {
    if (!game) return;

    game.render = (t) => {
      const render = GameApp.Render && GameApp.Render.renderWithCssSize;
      if (!render) return;

      const canvas = GameApp.DOM && GameApp.DOM.canvas ? GameApp.DOM.canvas : null;
      const fallbackSize = canvas ? { w: canvas.width, h: canvas.height } : { w: 0, h: 0 };
      const size = GameApp.Canvas && GameApp.Canvas.getCssSize
        ? GameApp.Canvas.getCssSize()
        : fallbackSize;

      render(game, t, size.w, size.h);
    };
  }

  RenderSystems.attachRenderer = attachRenderer;
})();
