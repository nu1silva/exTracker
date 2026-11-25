/* Runs the design screens in a browser without a build step or a server.
   Design use only: the product front end does not need this file.

   A screen is a <template id="screen"> plus a class with state and renderVals().
   Template syntax:
     {{ path }}                                 a value from renderVals()
     onClick="{{ fn }}"                         an event handler
     <sc-for list="{{ items }}" as="item">      repeat
     <sc-if value="{{ flag }}">                 show when true
     <dc-import name="AppNav" theme="dark">     a shared part, see parts/ */

(function () {
  const parts = {};
  const THEME_KEY = 'extracker-design-theme';

  class DCLogic {
    constructor(props) { this.props = props; this.state = {}; }
    setState(change) {
      this.state = { ...this.state, ...change };
      if (this.update) this.update();
    }
    renderVals() { return {}; }
  }

  const WHOLE = /^\s*\{\{\s*([\w$.]+)\s*\}\}\s*$/;
  const HOLE = /\{\{\s*([\w$.]+)\s*\}\}/g;
  const look = (path, scope) => path.split('.').reduce((v, key) => (v == null ? undefined : v[key]), scope);
  const fill = (text, scope) => text.replace(HOLE, (_, path) => look(path, scope) ?? '');
  const read = (text, scope) => {
    const whole = text.match(WHOLE);
    return whole ? look(whole[1], scope) : fill(text, scope);
  };
  const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  /* Template nodes and values in, a plain description of the DOM out */
  function describe(nodes, scope) {
    const out = [];
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const blank = !node.data.trim() && node.data.includes('\n');
        if (!blank) out.push({ text: fill(node.data, scope) });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.localName;
      const attr = (name) => read(node.getAttribute(name) ?? '', scope);

      if (tag === 'sc-for') {
        (attr('list') || []).forEach((item, i) => {
          const inner = Object.create(scope);
          inner[node.getAttribute('as')] = item;
          inner.$index = i;
          out.push(...describe(node.childNodes, inner));
        });
        return;
      }
      if (tag === 'sc-if') {
        /* A hidden branch keeps its place, so what follows is not rebuilt */
        out.push(...(attr('value') ? describe(node.childNodes, scope) : [{ empty: true }]));
        return;
      }
      if (tag === 'dc-import') {
        const props = {};
        [...node.attributes].forEach((a) => { if (a.name !== 'name') props[camel(a.name)] = read(a.value, scope); });
        out.push({ part: node.getAttribute('name'), props });
        return;
      }

      const attrs = {}, events = {};
      [...node.attributes].forEach((a) => {
        const value = read(a.value, scope);
        if (a.name.startsWith('on')) events[a.name === 'onchange' ? 'input' : a.name.slice(2)] = value;
        else attrs[a.name] = value;
      });
      out.push({ tag, ns: node.namespaceURI, attrs, events, children: describe(node.childNodes, scope) });
    });
    return out;
  }

  const same = (a, b) => ('text' in a && 'text' in b) || (a.empty && b.empty) ||
    (a.part && a.part === b.part) || (a.tag && a.tag === b.tag && a.ns === b.ns);

  function create(v) {
    if ('text' in v) v.el = document.createTextNode(v.text);
    else if (v.empty) v.el = document.createComment('');
    else if (v.part) {
      v.instance = mount(parts[v.part].Logic, parts[v.part].nodes, v.props);
      v.el = v.instance.el;
    } else {
      v.el = document.createElementNS(v.ns, v.tag);
      paint(v, { attrs: {}, events: {}, children: [] });
    }
    return v.el;
  }

  function patch(v, old) {
    v.el = old.el;
    if ('text' in v) { if (v.text !== old.text) v.el.data = v.text; }
    else if (v.part) {
      v.instance = old.instance;
      v.instance.logic.props = v.props;
      v.instance.render();
    } else if (v.tag) paint(v, old);
  }

  function paint(v, old) {
    const el = v.el;
    new Set([...Object.keys(old.attrs), ...Object.keys(v.attrs)]).forEach((name) => {
      const value = v.attrs[name];
      if (name === 'value' || value === old.attrs[name]) return;
      const flag = name === 'disabled';
      if (value == null || (flag && !value)) el.removeAttribute(name);
      else el.setAttribute(name, flag ? '' : String(value));
    });

    Object.entries(v.events).forEach(([type, fn]) => {
      if (!(type in old.events)) el.addEventListener(type, (e) => el.handlers[type] && el.handlers[type](e));
      (el.handlers ||= {})[type] = fn;
    });

    v.children.forEach((child, i) => {
      const before = old.children[i];
      if (!before) el.appendChild(create(child));
      else if (same(child, before)) patch(child, before);
      else el.replaceChild(create(child), before.el);
    });
    old.children.slice(v.children.length).forEach((child) => el.removeChild(child.el));

    /* Last, because a select needs its options first */
    if ('value' in v.attrs) {
      const value = String(v.attrs.value ?? '');
      if (v.tag === 'option') el.setAttribute('value', value);
      else if (el.value !== value) el.value = value;
    }
  }

  function mount(Logic, nodes, props) {
    const logic = new Logic(props);
    logic.props = props;
    const instance = { logic };
    let tree = null;
    instance.render = () => {
      const [next] = describe(nodes, logic.renderVals());
      if (tree) patch(next, tree); else create(next);
      tree = next;
      instance.el = tree.el;
    };
    logic.update = instance.render;
    instance.render();
    return instance;
  }

  const rootsOf = (template) => [...template.content.childNodes].filter((n) => n.nodeType === Node.ELEMENT_NODE);

  function savedTheme() {
    const asked = new URLSearchParams(location.search).get('theme');
    if (asked) return asked;
    try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; }
  }

  window.DCLogic = DCLogic;
  window.Prototype = {
    part(name, Logic, html) {
      const template = document.createElement('template');
      template.innerHTML = html;
      parts[name] = { Logic, nodes: rootsOf(template) };
    },
    screen(Logic) {
      const props = {
        theme: savedTheme(),
        setTheme(theme) {
          try { localStorage.setItem(THEME_KEY, theme); } catch { /* the switch still works on this page */ }
          instance.logic.props = { ...props, theme };
          instance.render();
        }
      };
      const instance = mount(Logic, rootsOf(document.getElementById('screen')), props);
      document.getElementById('app').appendChild(instance.el);
    }
  };
})();
