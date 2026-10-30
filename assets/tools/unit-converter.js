/* ============================================================
   Unit converter — length, mass, volume, temperature and speed.
   Every factor is exact by definition and shown with the result.
   Temperature uses the standard offset formulas, not a ratio.
   ============================================================ */
window.TOOL = (function () {
  'use strict';

  var TK = window.ToolKit;

  /* All factors convert to the category's base unit. */
  var DATA = {
    length: {
      base: 'm',
      factors: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 }
    },
    mass: {
      base: 'kg',
      factors: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.45359237, oz: 0.028349523125 }
    },
    volume: {
      base: 'l',
      factors: { l: 1, ml: 0.001, m3: 1000, gal: 3.785411784, qt: 0.946352946, cup: 0.2365882365, floz: 0.0295735295625 }
    },
    temperature: {
      base: 'c',
      units: ['c', 'f', 'k'],
      temp: true
    },
    speed: {
      base: 'ms',
      factors: { ms: 1, kmh: 0.2777777777777778, mph: 0.44704, kn: 0.5144444444444445 }
    }
  };

  function toCelsius(v, from) {
    if (from === 'c') return v;
    if (from === 'f') return (v - 32) * 5 / 9;
    return v - 273.15;                              // k
  }
  function fromCelsius(c, to) {
    if (to === 'c') return c;
    if (to === 'f') return c * 9 / 5 + 32;
    return c + 273.15;                              // k
  }

  function mount(json, X) {
    var ui = X.ui, common = X.common;
    var host = document.getElementById('tool-ui');
    if (!host) return;

    var box = TK.msg();
    var out = TK.rows();

    var cat = TK.select({
      id: 'uc-cat',
      label: ui('category'),
      value: 'length',
      options: Object.keys(DATA).map(function (k) {
        return { value: k, label: X.get('units.' + k + '.name') };
      }),
      onChange: function () { rebuildUnits(); render(); }
    });

    var value = TK.field({
      id: 'uc-value',
      label: ui('value'),
      type: 'text',
      inputmode: 'decimal',
      placeholder: '12.5',
      onInput: render
    });

    var from = TK.select({ id: 'uc-from', label: ui('from'), options: [], onChange: render });
    var to = TK.select({ id: 'uc-to', label: ui('to'), options: [], onChange: render });

    var swap = TK.btn(ui('swap'), function () {
      var a = from.select.value;
      from.select.value = to.select.value;
      to.select.value = a;
      render();
    }, { secondary: true });

    var unitGrid = TK.el('div', { class: 'tk-grid tk-grid-3' });
    unitGrid.appendChild(from.row);
    unitGrid.appendChild(to.row);
    var swapWrap = TK.el('div', { class: 'tk-field tk-swap' });
    swapWrap.appendChild(TK.el('span', { class: 'tk-field-label' }, ' '));
    swapWrap.appendChild(swap);
    unitGrid.appendChild(swapWrap);

    host.appendChild(cat.row);
    host.appendChild(value.row);
    host.appendChild(unitGrid);
    host.appendChild(box);
    host.appendChild(out);

    function unitName(key) {
      return X.get('units.' + cat.select.value + '.units.' + key) || key;
    }

    function rebuildUnits() {
      var def = DATA[cat.select.value];
      var keys = def.temp ? def.units : Object.keys(def.factors);
      var opts = keys.map(function (k) { return { value: k, label: unitName(k) }; });
      [from, to].forEach(function (sel, i) {
        var previous = sel.select.value;
        sel.select.textContent = '';
        opts.forEach(function (o) {
          var opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = o.label;
          if (o.value === previous) opt.setAttribute('selected', '');
          sel.select.appendChild(opt);
        });
        if (!keys.some(function (k) { return k === previous; })) {
          sel.select.value = keys[i === 0 ? 0 : Math.min(1, keys.length - 1)];
        }
      });
      // A useful default pair: metric → imperial where both exist.
      if (cat.select.value === 'length') { from.select.value = 'km'; to.select.value = 'mi'; }
      if (cat.select.value === 'mass') { from.select.value = 'kg'; to.select.value = 'lb'; }
      if (cat.select.value === 'volume') { from.select.value = 'l'; to.select.value = 'gal'; }
      if (cat.select.value === 'temperature') { from.select.value = 'c'; to.select.value = 'f'; }
      if (cat.select.value === 'speed') { from.select.value = 'kmh'; to.select.value = 'mph'; }
    }

    function render() {
      var def = DATA[cat.select.value];
      var raw = String(value.input.value).trim().replace(/,/g, '.');
      if (raw === '') {
        out.render([]);
        box.show(ui('empty'));
        return;
      }
      if (!/^-?\d*\.?\d+([eE][-+]?\d+)?$/.test(raw)) {
        out.render([]);
        box.show(ui('badValue'), 'error');
        return;
      }
      var v = parseFloat(raw);
      var f = from.select.value;
      var t = to.select.value;

      var result, factorLine;

      if (def.temp) {
        if (f === 'k' && v < 0) {
          out.render([]);
          box.show(ui('kelvinNegative'), 'error');
          return;
        }
        var c = toCelsius(v, f);
        if (f === 'k' && c < -273.15) {
          out.render([]);
          box.show(ui('kelvinNegative'), 'error');
          return;
        }
        result = fromCelsius(c, t);
        if (t === 'k' && result < 0) {
          out.render([]);
          box.show(ui('kelvinNegative'), 'error');
          return;
        }
        factorLine = {
          c: '°C = (°F − 32) × 5/9',
          f: '°F = °C × 9/5 + 32',
          k: 'K = °C + 273.15'
        }[f === t ? f : t];
      } else {
        var base = v * def.factors[f];
        result = base / def.factors[t];
        var ratio = def.factors[f] / def.factors[t];
        factorLine = '1 ' + unitName(f) + ' = ' + TK.num(ratio, 10) + ' ' + unitName(t);
      }

      if (!isFinite(result)) {
        out.render([]);
        box.show(ui('badValue'), 'error');
        return;
      }
      box.clear();
      out.render([
        [unitName(t), TK.num(result, 6), 'is-strong'],
        [ui('formula'), factorLine]
      ]);
    }

    rebuildUnits();
    render();
  }

  return { mount: mount };
})();
