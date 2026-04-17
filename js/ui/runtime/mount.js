const templates = new Map();

export async function loadTemplates(urls) {
  const host = document.getElementById('templates');
  if (!host) throw new Error('模板容器 #templates 不存在');
  for (const url of urls) {
    const html = await fetch(url).then((response) => {
      if (!response.ok) throw new Error(`模板加载失败: ${url}`);
      return response.text();
    });
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    for (const tpl of wrap.querySelectorAll('template')) {
      templates.set(tpl.id, tpl);
      host.appendChild(tpl);
    }
  }
}

export function cloneTemplate(id) {
  const template = templates.get(id);
  if (!template) throw new Error(`找不到模板: ${id}`);
  return template.content.cloneNode(true);
}
