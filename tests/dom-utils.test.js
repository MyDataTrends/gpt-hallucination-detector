import { createElement } from '../src/utils/dom-utils.js';

test('createElement applies attributes and children', () => {
  const child = document.createElement('span');
  const el = createElement('div', {
    class: 'foo',
    id: 'bar',
    style: { color: 'red' }
  }, [child]);

  expect(el.tagName).toBe('DIV');
  expect(el.className).toBe('foo');
  expect(el.getAttribute('id')).toBe('bar');
  expect(el.style.color).toBe('red');
  expect(el.firstChild).toBe(child);
});
