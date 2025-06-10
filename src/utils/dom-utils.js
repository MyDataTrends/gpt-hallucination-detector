export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'class') {
            el.className = value;
        } else if (key === 'style') {
            Object.assign(el.style, value);
        } else {
            el.setAttribute(key, value);
        }
    });
    children.forEach(child => el.appendChild(child));
    return el;
}
