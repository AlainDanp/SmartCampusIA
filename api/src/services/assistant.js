// Assistant IA (US-04 / US-05)
// - Si BEDROCK_MODEL_ID est défini : Amazon Bedrock (API Converse), réponse JSON structurée.
// - Sinon, ou si Bedrock échoue : repli par mots-clés sur la FAQ (plan B).
const FAQ = require('../../faq.json');

const NE_SAIS_PAS = "Je ne sais pas répondre à cette question : elle n'est pas couverte par la FAQ du campus. "
  + 'Si vous rencontrez un problème, je peux vous aider à créer un signalement.';

const normaliser = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// ─── Bedrock ───────────────────────────────────────────────────────────
let bedrock;
let BedrockCmd;
if (process.env.BEDROCK_MODEL_ID) {
  BedrockCmd = require('@aws-sdk/client-bedrock-runtime');
  bedrock = new BedrockCmd.BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1',
  });
}

function promptSysteme({ categories, lieux }) {
  return `Tu es l'assistant de SmartCampus AI, la plateforme de gestion des incidents d'un campus.
Tu réponds en français, de façon claire et brève.

RÈGLES STRICTES :
1. Tu réponds UNIQUEMENT à partir de la FAQ ci-dessous. Si la réponse n'y est pas, tu le dis et tu n'inventes RIEN.
2. Si l'étudiant décrit un incident (panne, matériel défectueux, problème réseau, salle fermée, fuite, danger…),
   mets "incidentDetecte" à true et prépare une suggestion de signalement.
3. Tu ne crées jamais de ticket toi-même : tu proposes seulement une suggestion que l'étudiant validera.

FAQ :
${FAQ.map((f) => `[${f.id}] ${f.titre} : ${f.reponse}`).join('\n')}

CATÉGORIES (id : libellé) :
${categories.map((c) => `${c.id} : ${c.libelle}`).join('\n')}

LIEUX (id : bâtiment · salle) :
${lieux.map((l) => `${l.id} : ${l.batiment} · ${l.salle}`).join('\n')}

Réponds STRICTEMENT avec un objet JSON, sans texte autour :
{"reponse": "texte pour l'étudiant", "sourceFaqId": "FAQ-XXX" ou null, "incidentDetecte": true|false,
 "suggestion": {"description": "description de l'incident", "categorieId": nombre ou null, "lieuId": nombre ou null} ou null}`;
}

async function viaBedrock(message, refs) {
  const out = await bedrock.send(new BedrockCmd.ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID,
    system: [{ text: promptSysteme(refs) }],
    messages: [{ role: 'user', content: [{ text: message }] }],
    inferenceConfig: { maxTokens: 600, temperature: 0 },
  }));
  const texte = out.output.message.content.map((c) => c.text || '').join('');
  const json = JSON.parse(texte.slice(texte.indexOf('{'), texte.lastIndexOf('}') + 1));
  const source = FAQ.find((f) => f.id === json.sourceFaqId);
  return {
    reponse: json.reponse || NE_SAIS_PAS,
    source: source ? { id: source.id, titre: source.titre } : null,
    incidentDetecte: Boolean(json.incidentDetecte),
    suggestion: json.suggestion || null,
    moteur: 'bedrock',
  };
}

// ─── Repli mots-clés ───────────────────────────────────────────────────
const MOTS_INCIDENT = ['ne marche', 'marche pas', 'fonctionne pas', 'ne fonctionne', 'en panne', 'panne', 'casse',
  "s'allume pas", 'allume pas', 'bloque', 'fuite', 'fermee', 'inaccessible', 'coupe', 'hors service', 'danger', 'incendie', 'fumee'];

const MOTS_CATEGORIE = [
  { motif: 'securite', mots: ['danger', 'incendie', 'fumee', 'alarme', 'extincteur', 'blesse', 'agress'] },
  { motif: 'reseau', mots: ['wifi', 'wi-fi', 'internet', 'reseau', 'connexion'] },
  { motif: 'salle fermee', mots: ['fermee', 'ferme a cle', 'porte', 'badge refuse', 'acces'] },
  { motif: 'batiment', mots: ['fuite', 'chauffage', 'lumiere', 'toilettes', 'wc', 'fenetre', 'climatisation'] },
  { motif: 'materiel', mots: ['projecteur', 'videoprojecteur', 'ordinateur', 'pc', 'ecran', 'imprimante', 'prise', 'chaise', 'table', 'clavier'] },
];

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// « bu » ne doit pas matcher « bureau », ni « ent » matcher « comment » (RG-09 : pas de fausse réponse)
const motEntier = (txt, mot) => new RegExp(`(^|[^a-z0-9])${echapper(normaliser(mot))}s?([^a-z0-9]|$)`).test(txt);
const debutDeMot = (txt, mot) => new RegExp(`(^|[^a-z0-9])${echapper(normaliser(mot))}`).test(txt);

function viaMotsCles(message, { categories, lieux }) {
  const txt = normaliser(message);

  let meilleure = null;
  let meilleurScore = 0;
  for (const f of FAQ) {
    const score = f.motsCles.filter((m) => motEntier(txt, m)).length;
    if (score > meilleurScore) { meilleure = f; meilleurScore = score; }
  }

  const incidentDetecte = MOTS_INCIDENT.some((m) => txt.includes(m));
  let suggestion = null;
  if (incidentDetecte) {
    const regle = MOTS_CATEGORIE.find((r) => r.mots.some((m) => debutDeMot(txt, m)));
    const categorie = regle && categories.find((c) => normaliser(c.libelle).includes(regle.motif));
    const lieu = lieux.find((l) => new RegExp(`\\b${normaliser(l.salle)}\\b`).test(txt));
    suggestion = { description: message.trim(), categorieId: categorie?.id ?? null, lieuId: lieu?.id ?? null };
  }

  let reponse;
  if (incidentDetecte && meilleure) {
    reponse = `${meilleure.reponse}\n\nSi le problème persiste, vous pouvez créer un signalement : je l'ai pré-rempli pour vous.`;
  } else if (incidentDetecte) {
    reponse = "Cela ressemble à un incident. Je ne peux pas le résoudre moi-même, mais je peux pré-remplir un signalement pour vous.";
  } else if (meilleure) {
    reponse = meilleure.reponse;
  } else {
    reponse = NE_SAIS_PAS;
  }

  return {
    reponse,
    source: meilleure ? { id: meilleure.id, titre: meilleure.titre } : null,
    incidentDetecte,
    suggestion,
    moteur: 'faq',
  };
}

// ─── Point d'entrée ────────────────────────────────────────────────────
async function repondre(message, refs) {
  let resultat;
  if (bedrock) {
    try {
      resultat = await viaBedrock(message, refs);
    } catch (err) {
      console.error('[assistant] Bedrock indisponible, repli FAQ :', err.message);
    }
  }
  if (!resultat) resultat = viaMotsCles(message, refs);

  // Garde-fous : on ne garde que des identifiants connus (champ vide sinon, cf. US-05)
  if (resultat.suggestion) {
    const s = resultat.suggestion;
    if (!categoriesConnues(refs).has(Number(s.categorieId))) s.categorieId = null;
    if (!new Set(refs.lieux.map((l) => l.id)).has(Number(s.lieuId))) s.lieuId = null;
    if (!s.description) s.description = message.trim();
  }
  // US-05 : bouton « Créer un signalement » si incident détecté OU pas de réponse
  resultat.proposerSignalement = resultat.incidentDetecte || !resultat.source;
  if (resultat.proposerSignalement && !resultat.suggestion) {
    resultat.suggestion = { description: message.trim(), categorieId: null, lieuId: null };
  }
  return resultat;
}

const categoriesConnues = (refs) => new Set(refs.categories.map((c) => c.id));

module.exports = { repondre, viaMotsCles, moteur: () => (bedrock ? 'bedrock' : 'faq') };
