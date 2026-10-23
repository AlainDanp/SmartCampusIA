-- SmartCampus AI — données de démonstration
-- Tous les comptes : mot de passe « demo1234 »

INSERT INTO utilisateur (id, nom, email, mot_de_passe, role) VALUES
 (1, 'Léa Martin',     'lea@campus.fr',    'scrypt$smartcampus-demo$126420dbdc9b11c5ca93dd38208c219f1b796dbf0189186298248f111cdbd228', 'ETUDIANT'),
 (2, 'Tom Bernard',    'tom@campus.fr',    'scrypt$smartcampus-demo$126420dbdc9b11c5ca93dd38208c219f1b796dbf0189186298248f111cdbd228', 'ETUDIANT'),
 (3, 'Karim Haddad',   'karim@campus.fr',  'scrypt$smartcampus-demo$126420dbdc9b11c5ca93dd38208c219f1b796dbf0189186298248f111cdbd228', 'TECHNICIEN'),
 (4, 'Julie Moreau',   'julie@campus.fr',  'scrypt$smartcampus-demo$126420dbdc9b11c5ca93dd38208c219f1b796dbf0189186298248f111cdbd228', 'TECHNICIEN'),
 (5, 'Sophie Laurent', 'sophie@campus.fr', 'scrypt$smartcampus-demo$126420dbdc9b11c5ca93dd38208c219f1b796dbf0189186298248f111cdbd228', 'ADMIN');
SELECT setval('utilisateur_id_seq', 5);

-- RG-03 / RG-04 / RG-13 : priorité par défaut et technicien référent par catégorie
INSERT INTO categorie (id, libelle, priorite_defaut, technicien_id) VALUES
 (1, 'Matériel défectueux',   'NORMALE',  3),
 (2, 'Problème réseau',       'HAUTE',    3),
 (3, 'Salle fermée',          'NORMALE',  4),
 (4, 'Bâtiment / sanitaires', 'NORMALE',  4),
 (5, 'Sécurité',              'CRITIQUE', 4);
SELECT setval('categorie_id_seq', 5);

INSERT INTO lieu (id, batiment, salle) VALUES
 (1, 'Bâtiment A', 'A12'),
 (2, 'Bâtiment A', 'A14'),
 (3, 'Bâtiment B', 'B105'),
 (4, 'Bâtiment B', 'B204'),
 (5, 'Bâtiment C', 'C001'),
 (6, 'Bâtiment C', 'Bibliothèque'),
 (7, 'Bâtiment C', 'Cafétéria'),
 (8, 'Extérieur',  'Parking');
SELECT setval('lieu_id_seq', 8);

-- 22 tickets répartis sur ~4 mois pour alimenter le tableau de bord (US-06)
INSERT INTO ticket (auteur_id, technicien_id, categorie_id, lieu_id, description, priorite, statut, date_creation, date_maj, date_resolution) VALUES
 (1, 3, 1, 4, 'Le vidéoprojecteur ne s''allume pas',                 'NORMALE',  'RESOLU',   now()-interval '110 days', now()-interval '109 days', now()-interval '109 days'),
 (2, 3, 2, 1, 'Wi-Fi très lent en A12',                               'HAUTE',    'RESOLU',   now()-interval '95 days',  now()-interval '94 days',  now()-interval '94 days'),
 (1, 4, 4, 7, 'Fuite d''eau sous l''évier de la cafétéria',           'NORMALE',  'RESOLU',   now()-interval '80 days',  now()-interval '77 days',  now()-interval '77 days'),
 (2, 4, 3, 3, 'Salle B105 fermée à clé pendant le TD',                'NORMALE',  'RESOLU',   now()-interval '62 days',  now()-interval '62 days',  now()-interval '62 days'),
 (1, 3, 1, 2, 'Imprimante bloquée, bourrage papier',                  'NORMALE',  'RESOLU',   now()-interval '55 days',  now()-interval '53 days',  now()-interval '53 days'),
 (2, 3, 2, 6, 'Pas de connexion internet à la bibliothèque',          'HAUTE',    'RESOLU',   now()-interval '48 days',  now()-interval '47 days',  now()-interval '47 days'),
 (1, 4, 5, 8, 'Éclairage du parking en panne, zone dangereuse le soir','CRITIQUE', 'RESOLU',   now()-interval '40 days',  now()-interval '39 days',  now()-interval '39 days'),
 (2, 3, 1, 4, 'Écran de la salle B204 qui clignote',                  'NORMALE',  'RESOLU',   now()-interval '33 days',  now()-interval '30 days',  now()-interval '30 days'),
 (1, 3, 2, 1, 'Wi-Fi coupé en A12',                                    'HAUTE',    'RESOLU',   now()-interval '26 days',  now()-interval '25 days',  now()-interval '25 days'),
 (2, 4, 4, 5, 'Chauffage en panne en C001',                            'NORMALE',  'RESOLU',   now()-interval '21 days',  now()-interval '18 days',  now()-interval '18 days'),
 (1, 3, 1, 3, 'Prise électrique arrachée en B105',                     'NORMALE',  'RESOLU',   now()-interval '17 days',  now()-interval '16 days',  now()-interval '16 days'),
 (2, 3, 2, 4, 'Wi-Fi instable en B204',                                'HAUTE',    'RESOLU',   now()-interval '12 days',  now()-interval '11 days',  now()-interval '11 days'),
 (1, 4, 3, 2, 'Badge refusé à l''entrée de la salle A14',              'NORMALE',  'RESOLU',   now()-interval '9 days',   now()-interval '8 days',   now()-interval '8 days'),
 (2, 4, 4, 7, 'Toilettes hors service à la cafétéria',                 'NORMALE',  'RESOLU',   now()-interval '6 days',   now()-interval '5 days',   now()-interval '5 days'),
 (1, 3, 1, 5, 'Ordinateur du poste 3 ne démarre plus',                 'NORMALE',  'EN_COURS', now()-interval '5 days',   now()-interval '4 days',   NULL),
 (2, 3, 2, 6, 'Wi-Fi inaccessible à la bibliothèque',                  'HAUTE',    'EN_COURS', now()-interval '4 days',   now()-interval '3 days',   NULL),
 (1, 4, 4, 3, 'Lumière qui grésille en B105',                          'NORMALE',  'EN_COURS', now()-interval '3 days',   now()-interval '2 days',   NULL),
 (2, 4, 5, 7, 'Extincteur manquant à la cafétéria',                    'CRITIQUE', 'NOUVEAU',  now()-interval '2 days',   now()-interval '2 days',   NULL),
 (1, 3, 2, 1, 'Wi-Fi qui se déconnecte toutes les 5 minutes en A12',   'HAUTE',    'NOUVEAU',  now()-interval '2 days',   now()-interval '2 days',   NULL),
 (2, 3, 1, 4, 'Télécommande du vidéoprojecteur introuvable',           'NORMALE',  'NOUVEAU',  now()-interval '1 day',    now()-interval '1 day',    NULL),
 (1, 4, 3, 5, 'Salle C001 fermée alors qu''un cours y est prévu',      'NORMALE',  'NOUVEAU',  now()-interval '20 hours', now()-interval '20 hours', NULL),
 (2, 4, 4, 2, 'Fenêtre bloquée ouverte en A14',                        'NORMALE',  'NOUVEAU',  now()-interval '6 hours',  now()-interval '6 hours',  NULL);

-- Historique cohérent avec les statuts (RG-06 / US-02)
INSERT INTO historique (ticket_id, auteur_id, ancien_statut, nouveau_statut, commentaire, date)
SELECT id, auteur_id, NULL, 'NOUVEAU', 'Ticket créé', date_creation FROM ticket;

INSERT INTO historique (ticket_id, auteur_id, ancien_statut, nouveau_statut, commentaire, date)
SELECT id, technicien_id, 'NOUVEAU', 'EN_COURS', 'Prise en charge', date_creation + (COALESCE(date_resolution, date_maj) - date_creation) / 2
FROM ticket WHERE statut IN ('EN_COURS', 'RESOLU');

INSERT INTO historique (ticket_id, auteur_id, ancien_statut, nouveau_statut, commentaire, date)
SELECT id, technicien_id, 'EN_COURS', 'RESOLU', 'Intervention effectuée, problème corrigé', date_resolution
FROM ticket WHERE statut = 'RESOLU';
