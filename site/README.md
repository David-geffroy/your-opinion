# Site

C'est le dossier contenant le fonctionnement intégral du site web ainsi que les diverses applications
Il est néccessaire de faire un npm install lors de la récupération afin d'installer les modules.
Ne pas lancer app.js depuis ce dossier, mais bien depuis frontal/

## Dépendances Modules Node

- async-validate
- bcrypt-nodejs
- body-parser
- connect-flash
- connect-mongo
- cookie-parser
- crypto
- debug
- ejs
- express
- express-params
- express-session
- mongoose
- mongoose-findorcreate
- morgan
- passport
- passport-facebook
- passport-google-oauth
- passport-local
- recaptcha-async
- request
- serve-favicon

## Arborescence

```
├── auth				- Configuration de l'authentification avec PassportJS
├── config				- Config Serveur Dev / Prod
├── db					- Dossier de la base de données (Non versionné)
├── models				- Modeles de données (pour MongoDB - Mongoose)
├── node_modules		- Modules Nodes (Non versionnés)
├── public				- Front-end de l'application. Contient les fichiers AngularJS, HTML, CSS
├── routes				- Définitions des routes pour le site et les API
├── util				- Dossier contenant les diverses fonctions codées en interne
├── views				- Dossier des vues en EJS
├── wordpress-plugin	- Dossier contenant les fichiers du plugin Wordpress
├── app.js				- Fichier de lancement NodeJS (Appelé par frontal)
└── package.json		- Fichier de conf pour NPM (Installer les modules NodeJS)
```
