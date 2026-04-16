(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const config = {
    url: "https://dhlvrnpjcggtxtarpdhf.supabase.co",
    publicKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobHZybnBqY2dndHh0YXJwZGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzg5MDQsImV4cCI6MjA4NDA1NDkwNH0.0XE6QcZBoB0tfqmt_-7BJw2doTR8e6vEypEDYNB8DfE"
  };

  GameApp.Config = GameApp.Config || {};
  GameApp.Config.supabase = config;
})();
