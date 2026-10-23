-- SmartCampus AI — schéma PostgreSQL
-- ATTENTION : ce script supprime et recrée toutes les tables (remise à zéro de la démo).

DROP TABLE IF EXISTS historique, ticket, utilisateur, lieu, categorie CASCADE;
DROP TYPE IF EXISTS role_t, statut_t, priorite_t CASCADE;

CREATE TYPE role_t     AS ENUM ('ETUDIANT', 'TECHNICIEN', 'ADMIN');
CREATE TYPE statut_t   AS ENUM ('NOUVEAU', 'EN_COURS', 'RESOLU');           -- RG-07 : ordre du cycle de vie
CREATE TYPE priorite_t AS ENUM ('NORMALE', 'HAUTE', 'CRITIQUE');            -- ordre croissant : ORDER BY priorite DESC = critique d'abord

CREATE TABLE utilisateur (
    id           SERIAL PRIMARY KEY,
    nom          TEXT        NOT NULL,
    email        TEXT        NOT NULL UNIQUE,
    mot_de_passe TEXT        NOT NULL,                 -- format scrypt$sel$hash
    role         role_t      NOT NULL
);

CREATE TABLE categorie (
    id              SERIAL PRIMARY KEY,
    libelle         TEXT       NOT NULL UNIQUE,
    priorite_defaut priorite_t NOT NULL DEFAULT 'NORMALE',   -- RG-04 / RG-03
    technicien_id   INT        REFERENCES utilisateur(id)    -- RG-13 : technicien référent de la catégorie
);

CREATE TABLE lieu (
    id        SERIAL PRIMARY KEY,
    batiment  TEXT NOT NULL,
    salle     TEXT NOT NULL,
    UNIQUE (batiment, salle)
);

CREATE TABLE ticket (
    id              SERIAL PRIMARY KEY,
    numero          TEXT GENERATED ALWAYS AS ('INC-' || lpad(id::text, 5, '0')) STORED,
    auteur_id       INT         NOT NULL REFERENCES utilisateur(id),
    technicien_id   INT                  REFERENCES utilisateur(id),
    categorie_id    INT         NOT NULL REFERENCES categorie(id),
    lieu_id         INT         NOT NULL REFERENCES lieu(id),
    description     TEXT        NOT NULL CHECK (length(trim(description)) > 0),   -- RG-01
    photo_key       TEXT,
    priorite        priorite_t  NOT NULL,
    statut          statut_t    NOT NULL DEFAULT 'NOUVEAU',                       -- RG-04
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_maj        TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_resolution TIMESTAMPTZ,                                                  -- RG-11
    relance_24h     TIMESTAMPTZ,                                                  -- RG-06 : date de la relance automatique
    CHECK ((statut = 'RESOLU') = (date_resolution IS NOT NULL))
);

CREATE TABLE historique (
    id             SERIAL PRIMARY KEY,
    ticket_id      INT         NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,  -- composition
    auteur_id      INT                  REFERENCES utilisateur(id),               -- NULL = système (relance RG-06)
    ancien_statut  statut_t,
    nouveau_statut statut_t    NOT NULL,
    commentaire    TEXT,
    date           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_auteur      ON ticket(auteur_id);
CREATE INDEX idx_ticket_technicien  ON ticket(technicien_id, statut);
CREATE INDEX idx_ticket_creation    ON ticket(date_creation);
CREATE INDEX idx_historique_ticket  ON historique(ticket_id, date);
