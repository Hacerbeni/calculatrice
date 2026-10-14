const info = document.querySelector(".infos");

const fenetre = document.getElementById("fenetre");

const historyContent = document.getElementById("historyContent");

// verification des chiffre
function estChiffre(c) {
  return c >= "0" && c <= "9";
}
// verification des signe
function estOperateur(c) {
  return c === "+" || c === "-" || c === "*" || c === "/" || c === "^";
}
// arrondi
function formater(n) {
  return String(parseFloat(n.toPrecision(12)));
}
//  decomposition des expression

function tokenizer(expression) {
  const tokens = [];

  let i = 0;

  while (i < expression.length) {
    const c = expression[i];

    if (c === " ") {
      i++;
      continue;
    }

    if (estChiffre(c) || c === ".") {
      let nombre = "";
      while (
        i < expression.length &&
        (estChiffre(expression[i]) || expression[i] === ".")
      ) {
        nombre += expression[i];
        i++;
      }
      if ((nombre.match(/\./g) || []).length > 1) {
        throw new Error("Nombre invalide");
      }
      tokens.push({ type: "nombre", valeur: parseFloat(nombre) });
      continue;
    }

    if (c === "π") {
      tokens.push({ type: "nombre", valeur: Math.PI });
      i++;
      continue;
    }
    if (c === "e") {
      tokens.push({ type: "nombre", valeur: Math.E });
      i++;
      continue;
    }

    const reste = expression.slice(i);
    const matchFonction = reste.match(/^(cos|sin|tan|log|ln|√)/);
    if (matchFonction) {
      tokens.push({ type: "fonction", valeur: matchFonction[0] });
      i += matchFonction[0].length;
      continue;
    }

    if (estOperateur(c)) {
      tokens.push({ type: "op", valeur: c });
      i++;
      continue;
    }

    if (c === "(") {
      tokens.push({ type: "parenGauche" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ type: "parenDroite" });
      i++;
      continue;
    }
    if (c === "%") {
      tokens.push({ type: "pourcent" });
      i++;
      continue;
    }
    if (c === "!") {
      tokens.push({ type: "factorielle" });
      i++;
      continue;
    }

    throw new Error("Caractère invalide : " + c);
  }

  return tokens;
}

// les fonctions

function appliquerFonction(nom, x) {
  switch (nom) {
    case "cos":
      return Math.cos(x);
    case "sin":
      return Math.sin(x);
    case "tan":
      return Math.tan(x);

    case "log":
      if (x <= 0) throw new Error("log invalide");
      return Math.log10(x);

    case "ln":
      if (x <= 0) throw new Error("ln invalide");
      return Math.log(x);

    case "√":
      if (x < 0) throw new Error("√ d'un négatif");
      return Math.sqrt(x);
  }
  throw new Error("Fonction inconnue : " + nom);
}

function factorielle(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("Factorielle invalide");
  }
  if (n > 170) return Infinity;

  let resultat = 1;
  for (let k = 2; k <= n; k++) {
    resultat *= k;
  }
  return resultat;
}

// gere les priorité des opertion

function parser(tokens) {
  let position = 0;

  function actuel() {
    return tokens[position];
  }

  function consommer() {
    return tokens[position++];
  }

  function estType(type) {
    return actuel() && actuel().type === type;
  }

  function estOp(valeur) {
    return actuel() && actuel().type === "op" && actuel().valeur === valeur;
  }

  function attendre(type) {
    if (!estType(type)) throw new Error("Syntaxe invalide");
    return consommer();
  }

  function primaire() {
    const t = actuel();
    if (!t) throw new Error("Expression incomplète");

    if (t.type === "nombre") {
      consommer();
      return t.valeur;
    }

    if (t.type === "parenGauche") {
      consommer();
      const valeur = expression();
      attendre("parenDroite");
      return valeur;
    }

    if (t.type === "fonction") {
      consommer();
      let argument;
      if (estType("parenGauche")) {
        consommer();
        argument = expression();
        attendre("parenDroite");
      } else {
        argument = unaire();
      }
      return appliquerFonction(t.valeur, argument);
    }

    throw new Error("Syntaxe invalide");
  }

  function postfixe() {
    let valeur = primaire();

    while (true) {
      if (estType("pourcent")) {
        consommer();
        valeur = valeur / 100;
      } else if (estType("factorielle")) {
        consommer();
        valeur = factorielle(valeur);
      } else {
        break;
      }
    }
    return valeur;
  }

  function puissance() {
    const base = postfixe();
    if (estOp("^")) {
      consommer();
      const exposant = unaire();
      return Math.pow(base, exposant);
    }
    return base;
  }

  function unaire() {
    if (estOp("-")) {
      consommer();
      return -unaire();
    }
    if (estOp("+")) {
      consommer();
      return unaire();
    }
    return puissance();
  }

  function terme() {
    let gauche = unaire();

    while (
      estOp("*") ||
      estOp("/") ||
      (actuel() &&
        (actuel().type === "fonction" ||
          actuel().type === "nombre" ||
          actuel().type === "parenGauche"))
    ) {
      let op = "*";
      if (estOp("*") || estOp("/")) {
        op = consommer().valeur;
      }

      const droite = unaire();
      if (op === "*") {
        gauche = gauche * droite;
      } else {
        if (droite === 0) throw new Error("Division par zéro");
        gauche = gauche / droite;
      }
    }
    return gauche;
  }

  function expression() {
    let gauche = terme();

    while (estOp("+") || estOp("-")) {
      const op = consommer().valeur;
      const droite = terme();

      if (op === "+") {
        gauche = gauche + droite;
      } else {
        gauche = gauche - droite;
      }
    }
    return gauche;
  }

  const resultat = expression();

  if (position < tokens.length) {
    throw new Error("Syntaxe invalide");
  }
  return resultat;
}

function calculer(expression) {
  const tokens = tokenizer(expression);
  return parser(tokens);
}

// l'affichage

function rafraichir() {}

// les operation associé au button
function val(valeur) {
  info.innerText = "";

  const fonctions = ["cos", "sin", "tan", "log", "ln", "√"];
  if (fonctions.includes(valeur)) {
    valeur = valeur + "(";
  }
  if (valeur === "x²") valeur = "^2";
  if (valeur === "1/x") valeur = "^(-1)";
  if (valeur === "x!") valeur = "!";

  fenetre.value = fenetre.value + valeur;
  rafraichir();
}

function suppr() {
  if (fenetre.value.length > 0) {
    fenetre.value = fenetre.value.slice(0, -1);
  } else {
    info.innerText = "";
  }
  rafraichir();
}

function clearAll() {
  fenetre.value = "";
  info.innerText = "";
  rafraichir();
}

function calcule() {
  if (fenetre.value === "") {
    info.innerText = "Veuillez écrire un chiffre";
    return;
  }
  try {
    const expressionInitiale = fenetre.value;
    const resultat = calculer(expressionInitiale);
    const resultatFormate = formater(resultat);

    addToHistory(expressionInitiale, resultatFormate);

    fenetre.value = resultatFormate;
    info.innerText = "";
  } catch (erreur) {
    info.innerText = erreur.message;
  }
  rafraichir();
}

function toggleSign() {
  const expr = fenetre.value;
  if (expr === "") return;

  let fin = expr.length - 1;
  while (
    fin >= 0 &&
    (expr[fin] === ")" || expr[fin] === "%" || expr[fin] === "!")
  ) {
    fin--;
  }
  if (fin < 0) return;

  let debut = fin;
  while (debut >= 0 && (estChiffre(expr[debut]) || expr[debut] === ".")) {
    debut--;
  }
  debut++;

  if (debut > 0 && expr[debut - 1] === "-") {
    const avant = debut >= 2 ? expr[debut - 2] : "";
    if (avant === "" || "+-*/^(".includes(avant)) {
      fenetre.value = expr.slice(0, debut - 1) + expr.slice(debut);
      rafraichir();
      return;
    }
  }
  fenetre.value = expr.slice(0, debut) + "-" + expr.slice(debut);
  rafraichir();
}

document.addEventListener("keydown", function (e) {
  const touche = e.key;

  if ("0123456789.+-*/^%()!".includes(touche) && touche.length === 1) {
    e.preventDefault();
    val(touche);
    return;
  }

  if (touche === "Enter" || touche === "=") {
    e.preventDefault();
    calcule();
    return;
  }

  if (touche === "Backspace") {
    e.preventDefault();
    suppr();
    return;
  }

  if (touche === "Escape" || touche === "Delete") {
    e.preventDefault();
    clearAll();
    return;
  }
});

// historique
function addToHistory(expression, result) {
  let divItem = document.createElement("div");
  let span = document.createElement("span");
  let button = document.createElement("button");

  divItem.className = "historyItem";
  divItem.style.display = "flex";
  divItem.style.justifyContent = "space-between";

  span.textContent = `${expression} = ${result}`;
  span.dataset.userInput = expression;
  span.style.cursor = "pointer";
  span.style.color = "black";
  span.style.fontSize = 0.85;

  button.textContent = "Delete";
  button.className = "btn-sm";
  button.style.backgroundColor = "red";
  button.style.color = "black";
  button.style.fontSize = 0.5;

  button.addEventListener("click", () => divItem.remove());
  span.addEventListener("click", () => {
    fenetre.value = span.dataset.userInput;
  });

  divItem.appendChild(span);
  divItem.appendChild(button);
  historyContent.appendChild(divItem);
}

// reset
fenetre.focus();
