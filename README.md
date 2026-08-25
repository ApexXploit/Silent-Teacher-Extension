# Silent Teacher Extension

[![Dernière version](https://img.shields.io/github/v/release/ApexXploit/Silent-Teacher-Extension?label=version)](https://github.com/ApexXploit/Silent-Teacher-Extension/releases/latest)
[![Télécharger](https://img.shields.io/badge/t%C3%A9l%C3%A9charger-derni%C3%A8re%20version-0d3b4a)](https://github.com/ApexXploit/Silent-Teacher-Extension/releases/latest)

Extension Chrome/Edge pour encadrer les tests d'admission **Silent Teacher** et le test d'anglais **English Skills Check**.

## Fonctionnalités

### Test technique Silent Teacher

- Comptage en direct des bonnes et mauvaises réponses.
- Calcul automatique du taux de précision.
- Indication du parcours terminé ou non terminé.
- Chronomètre de 20 minutes avec pause, reprise et réinitialisation.
- Alerte plein écran et arrêt automatique à la fin du temps.
- Enregistrement du nom, du prénom et des horaires du candidat.
- Capture automatique de la carte de résultat uniquement.
- Nom des captures au format `NOM_Prénom_Date_Heure.png`.
- Suppression de la progression Silent Teacher pour un nouveau candidat.

### Test d'anglais

- Questionnaire intégré limité à 20 minutes.
- Prénom, nom, adresse e-mail et numéro de téléphone obligatoires.
- Correction automatique des 20 questions fermées.
- Conservation des questions ouvertes et de la rédaction pour correction humaine.
- Envoi d'un bilan HTML avec le score, la précision et les coordonnées.
- Enregistrement de chaque passage dans Google Sheets avec les dates et heures.

## Version actuelle

Version de production : **4.1.3**.

[Télécharger automatiquement la dernière release](https://github.com/ApexXploit/Silent-Teacher-Extension/releases/latest)

Le badge et le lien pointent toujours vers la dernière release GitHub publiée.

## Installation

1. Télécharger la [dernière release](https://github.com/ApexXploit/Silent-Teacher-Extension/releases/latest).
2. Décompresser complètement l'archive dans un dossier permanent.
3. Ouvrir `chrome://extensions` ou `edge://extensions`.
4. Activer le **Mode développeur**.
5. Supprimer toute ancienne installation de l'extension.
6. Cliquer sur **Charger l'extension non empaquetée**.
7. Sélectionner le dossier contenant `manifest.json`.
8. Ouvrir ou recharger <https://silentteacher.toxicode.fr/>.

Ne chargez pas directement le ZIP et n'installez pas l'extension depuis un dossier temporaire. Cela peut provoquer `ERR_FILE_NOT_FOUND` lors de l'ouverture du test d'anglais.

## Utilisation

### Silent Teacher

Renseignez le prénom et le nom, puis cliquez sur **Démarrer**. **Pause** arrête le chronomètre et **Reprendre** le relance. Le chrono reste actif après un rechargement.

À la fin des 20 minutes, le bilan affiche l'identité, les horaires, les fautes, les bonnes réponses, la précision et l'état du parcours. La capture est envoyée par e-mail. Une copie locale est enregistrée dans `Téléchargements/Silent-Teacher` uniquement si l'envoi échoue.

Le bouton **Nouveau candidat** efface l'identité, le chrono et la progression conservée par Silent Teacher.

### English Skills Check

Cliquez sur **Ouvrir le test d'anglais**. Après validation des coordonnées, le chronomètre de 20 minutes démarre. À la remise ou à l'expiration, le bilan est envoyé et enregistré dans Google Sheets.

## Google Apps Script, e-mail et Google Sheets

Le dossier [`google-apps-script`](google-apps-script) contient le relais qui :

- envoie les bilans à `mgramino@simplon.co` ;
- produit les e-mails HTML ;
- crée le tableau **Résultats candidats - Silent Teacher** ;
- partage le tableau avec `mgramino@simplon.co` ;
- ajoute une ligne par passage avec les dates et heures au format `jj/mm/aaaa hh:mm:ss`.

Après une modification de `Code.gs`, créez une **nouvelle version du déploiement Web App** dans Google Apps Script et acceptez les autorisations Gmail, Google Sheets et Google Drive. Mettre uniquement l'extension à jour ne met pas le service Apps Script à jour.

## Mise à jour

Une extension chargée en mode développeur ne se met pas automatiquement à jour depuis GitHub. Pour installer une nouvelle version :

1. Télécharger la [dernière release](https://github.com/ApexXploit/Silent-Teacher-Extension/releases/latest).
2. Remplacer l'ancien dossier par le nouveau dossier décompressé.
3. Recharger ou réinstaller l'extension dans `chrome://extensions`.
