// Notifications in-app (US-02 R3) : on mémorise, par étudiant, le dernier statut vu de chaque ticket.
// Un ticket dont le statut a changé depuis la dernière visite de « Mes demandes » est « non lu ».
// Stockage local au navigateur : aucune modification du backend ni de la base.

export const EVENEMENT = 'sc-notifs';

const cle = (user) => `sc_vu_${user.id}`;

function lire(user) {
  try { return JSON.parse(localStorage.getItem(cle(user))); } catch { return null; }
}

function ecrire(user, vus) {
  try { localStorage.setItem(cle(user), JSON.stringify(vus)); } catch { /* stockage indisponible */ }
}

// Marque les tickets fournis comme vus, puis prévient la navbar
export function marquerVus(user, tickets) {
  const vus = lire(user) || {};
  tickets.forEach((t) => { vus[t.id] = t.statut; });
  ecrire(user, vus);
  window.dispatchEvent(new Event(EVENEMENT));
}

// Renvoie les tickets dont le statut a changé depuis la dernière consultation.
// Tout ticket naît « NOUVEAU » : c'est la référence s'il n'a jamais été vu.
export function ticketsModifies(user, tickets) {
  const vus = lire(user);
  if (!vus) {
    marquerVus(user, tickets); // première visite : on part de l'état actuel
    return [];
  }
  return tickets.filter((t) => (vus[t.id] ?? 'NOUVEAU') !== t.statut);
}
