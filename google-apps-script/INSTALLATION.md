# Déployer le relais Google Drive

1. Ouvrir <https://script.google.com/> et créer un **Nouveau projet**.
2. Remplacer le contenu de `Code.gs` par celui fourni dans ce dossier.
3. Dans `UPLOAD_SECRET`, remplacer la valeur d'exemple par une longue phrase secrète impossible à deviner.
4. Enregistrer le projet, par exemple sous le nom `Silent Teacher Upload`.
5. Cliquer sur **Déployer** → **Nouveau déploiement**.
6. Choisir **Application Web**.
7. Exécuter en tant que : **Moi**.
8. Qui a accès : **Tout le monde**.
9. Autoriser l'envoi d'e-mails lorsqu'il est demandé.
10. Copier l'URL se terminant par `/exec`.
11. Dans `chrome://extensions`, ouvrir **Détails** → **Options d'extension** pour Silent Teacher.
12. Coller l'URL `/exec` et le même secret, enregistrer, puis cliquer sur **Vérifier la connexion**.

Le script envoie les captures à `mgramino@simplon.co`.
