# Compteur de fautes – Silent Teacher

Cette extension Chrome/Edge affiche en direct, sur `silentteacher.toxicode.fr` :

- le nombre de mauvaises réponses ;
- un chronomètre manuel avec pause/reprise et réinitialisation ;
- un arrêt automatique et une alerte plein écran après 20 minutes ;
- la saisie obligatoire du nom et du prénom du candidat ;
- l'enregistrement des dates et heures de début et de fin ;
- une capture automatique de la fenêtre de fin ;
- le nombre de bonnes réponses ;
- le taux de précision ;
- les questions arrivées hors délai ;
- l'état terminé/en cours du test.
- un test d'anglais de 20 minutes pour les programmeurs de jeux vidéo 2D ;
- une correction automatique des 20 questions fermées ;
- l'envoi par e-mail du score synthétique et des réponses ouvertes à évaluer.

Elle lit l'historique que Silent Teacher conserve dans le navigateur. À la fin du test, l'identité, le bilan et la capture sont transmis au relais Google Apps Script privé afin d'envoyer l'e-mail de résultat.

## Version

Version de production actuelle : **4.0.0**.

## Installation dans Chrome

1. Ouvrir `chrome://extensions`.
2. Activer **Mode développeur** en haut à droite.
3. Cliquer sur **Charger l'extension non empaquetée**.
4. Sélectionner le dossier `silent-teacher-compteur`.
5. Ouvrir ou recharger <https://silentteacher.toxicode.fr/>.

Dans Edge, utiliser `edge://extensions` puis **Charger l’extension décompressée**.

## Utilisation

Le panneau apparaît en haut à droite. Renseignez le prénom et le nom du candidat, puis cliquez sur **Démarrer**. L'identité devient alors non modifiable et la date ainsi que l'heure exactes sont enregistrées. Le bouton **Pause** arrête le décompte et **Reprendre** le relance. Le chrono survit au rechargement de la page.

Le bouton **Ouvrir le test d'anglais** lance le questionnaire dans un nouvel onglet. Son chrono de 20 minutes démarre après validation de l'identité. Les parties vocabulaire, grammaire, QCM de compréhension et dialogue sont notées automatiquement sur 20. Les réponses ouvertes et la rédaction, représentant 10 points supplémentaires, sont reproduites dans l'e-mail pour correction humaine.
Le formulaire recueille également l'adresse e-mail et le numéro de téléphone du candidat ; ces coordonnées figurent dans le bilan transmis.
Lors du premier envoi, le Google Apps Script crée automatiquement le tableau **Résultats candidats - Silent Teacher**, le partage avec `mgramino@simplon.co`, puis ajoute une ligne pour chaque passage avec les dates et heures d'enregistrement, de début et de fin au format `jj/mm/aaaa hh:mm:ss`.

À `20:00`, le chrono s'arrête automatiquement et une fenêtre plein écran indique au candidat que le test est terminé. Elle affiche son identité, les horaires et le résultat. **Copier le bilan** produit une trace complète à coller dans votre suivi. **Fermer** masque la fenêtre, mais le chrono reste terminé.

Une capture de la **carte blanche de résultat uniquement** est automatiquement enregistrée dans le sous-dossier `Silent-Teacher` du dossier de téléchargement du navigateur. Le reste de la page et le fond sombre sont exclus de l'image. Son nom suit la nomenclature `NOM_Prénom_Date_Heure.png`, par exemple `DUPONT_Jeanne_2026-08-13_14-32-05.png`. Si le navigateur demande où enregistrer chaque téléchargement, cette boîte de dialogue peut tout de même apparaître.

## Envoi automatique par e-mail

Le dossier `google-apps-script` contient le relais qui envoie chaque capture à **mgramino@simplon.co** en pièce jointe. Une copie locale est créée uniquement en secours si l'envoi par e-mail est indisponible.

Le bouton **Nouveau candidat** demande confirmation, puis supprime le nom, le chrono, l'historique des réponses et toute la progression mise en cache par Silent Teacher. La page est ensuite rechargée au début du test. Copiez donc le bilan avant cette réinitialisation : les données supprimées ne sont pas récupérables depuis l'extension.

Le bouton **Copier le résultat** inclut le temps chronométré et produit une ligne prête à coller dans votre suivi candidat. La corbeille native de Silent Teacher remet le test et le compteur de fautes à zéro ; le chrono se réinitialise avec son propre bouton.

Le compteur correspond aux tentatives enregistrées comme `wrong_answer` par le site. Les expirations de temps sont indiquées séparément et ne sont pas comptées comme fautes.
