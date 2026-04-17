export function on(root, selector, type, handler) {
  root.addEventListener(type, (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) {
      handler(event, target);
    }
  });
}
