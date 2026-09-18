# Simplifier le parcours « Nouvel apurement »

## Objectif
Conserver l’apparence actuelle de GLOBITRANS et l’onglet Historique, tout en réduisant le parcours à : importer, définir la matière et les objectifs, rechercher, consulter les lignes, puis valider ou exporter.

## Modifications prévues
- Garder les onglets principaux « Nouvel apurement » et « Historique » inchangés.
- Ajouter sous « Nouvel apurement » les sous-onglets « Import fichier » et « Résultat de recherche ».
- Afficher par défaut « Import fichier » avec l’import, l’assistant, puis un formulaire compact : Matière, poids cible, valeur cible et tolérances.
- Retirer l’aperçu des données, le bouton « Voir les données », les critères avancés et le choix de priorité.
- Détecter automatiquement les valeurs uniques d’une colonne « Matière » importée, avec une liste MVP de secours.
- Faire filtrer le moteur par matière et appliquer automatiquement : exact d’abord, moins de lignes ensuite, plus faible écart en dernier.
- Après « Lancer la recherche », afficher brièvement l’analyse puis ouvrir automatiquement « Résultat de recherche ».
- Présenter le résumé de la recherche et 1 à 5 solutions, la meilleure ouverte par défaut, avec les lignes et une ligne TOTAL.
- Ajouter dans chaque solution « Valider l’apurement » et « Exporter Excel » ; conserver l’enregistrement dans l’Historique.
- Afficher un état vide avec « Commencer un apurement » si aucune recherche n’a été lancée.

## Détails techniques
- Étendre les critères avec une propriété `material`, compatible avec les anciennes données enregistrées.
- Reconnaître « Matière » et « Type marchandise » lors de l’import, sans casser les autres colonnes.
- Conserver les calculs déterministes en grammes et centimes et les composants visuels existants.
- Corriger les erreurs TypeScript réelles relevées pendant la vérification ; le texte après `TS2686:` dans le message ressemble à une spécification collée, pas au diagnostic TypeScript complet.
- Vérifier le parcours dans le navigateur sur ordinateur et mobile, sans modifier la sidebar, l’Historique ni les autres modules.
