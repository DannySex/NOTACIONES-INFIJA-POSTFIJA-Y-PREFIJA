const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
const DERECHA = { '^': true }; // asociatividad por la derecha

function tokenizar(texto) {
  const tokens = texto.match(/[A-Za-z0-9.]+|[-+*\/^()]/g) || [];
  if (tokens.join('') !== texto.replace(/\s+/g, '')) {
    throw new Error('La expresión tiene caracteres no válidos.');
  }
  return tokens;
}

// Shunting Yard: devuelve la salida postfija y los pasos para la tabla
function infijaAPostfija(tokens) {
  const salida = [], pila = [], pasos = [];
  for (const t of tokens) {
    if (t in PREC) {
      while (pila.length) {
        const top = pila[pila.length - 1];
        if (top in PREC && (PREC[top] > PREC[t] || (PREC[top] === PREC[t] && !DERECHA[t]))) {
          salida.push(pila.pop());
        } else break;
      }
      pila.push(t);
    } else if (t === '(') {
      pila.push(t);
    } else if (t === ')') {
      while (pila.length && pila[pila.length - 1] !== '(') salida.push(pila.pop());
      if (!pila.length) throw new Error('Paréntesis desbalanceados.');
      pila.pop();
    } else {
      salida.push(t);
    }
    pasos.push([t, salida.join(' '), pila.join(' ')]);
  }
  while (pila.length) {
    const op = pila.pop();
    if (op === '(') throw new Error('Paréntesis desbalanceados.');
    salida.push(op);
  }
  pasos.push(['fin', salida.join(' '), '']);
  return { salida, pasos };
}

// Construye el árbol desde la postfija y lo recorre en preorden
function postfijaAPrefija(postfija) {
  const pila = [];
  for (const t of postfija) {
    if (t in PREC) {
      const der = pila.pop(), izq = pila.pop();
      if (!izq || !der) throw new Error('Faltan operandos.');
      pila.push({ t, izq, der });
    } else {
      pila.push({ t });
    }
  }
  if (pila.length !== 1) throw new Error('Faltan operadores.');
  const preorden = n => (n.izq ? [n.t, ...preorden(n.izq), ...preorden(n.der)] : [n.t]);
  return preorden(pila[0]);
}

const $ = id => document.getElementById(id);

$('formulario').addEventListener('submit', e => {
  e.preventDefault();
  $('error').textContent = '';
  try {
    const texto = $('expresion').value.trim();
    if (!texto) throw new Error('Escribe una expresión.');
    const { salida, pasos } = infijaAPostfija(tokenizar(texto));
    const prefija = postfijaAPrefija(salida);
    $('pre').textContent = prefija.join(' ');
    $('post').textContent = salida.join(' ');
    $('pasos').innerHTML = pasos
      .map(p => `<tr><td class="m">${p[0]}</td><td class="m">${p[1]}</td><td class="m">${p[2]}</td></tr>`)
      .join('');
    $('salidas').hidden = false;
    $('detalle').hidden = false;
  } catch (err) {
    $('salidas').hidden = true;
    $('detalle').hidden = true;
    $('error').textContent = err.message;
  }
});