# What is your opinion

__What is your opinion__ est pune lateforme de modération collaborative. 


Vous pouvez insérer un système de commentaire sur votre site avec What is your opinion.
Les lecteurs peuvent participer à la modération. 
Le commentaire à modérer est proposé aléatoirement au lecteur.
Puis le commentaire est validé ou invalidé aléatoirement par un autre auteur.
Si une personne valide un commentaire puis ce commentaire est invalidé par les autres auteurs, elle perd des points.
Si un commentaire est validé par deux ou trois personnes, elle gagne des points.

## Installation (Windows)

### Les outils
-	NodeJS  - [Download](https://nodejs.org/download)
-	MongoDB - [Download](https://www.mongodb.org/downloads)

>	Penser à mettre le dossier des executables mongo et mongod dans les variables d'environnement 'path'.<br />
>   Il faudra peut-être redémarrer le PC.

Un fois que c'est fait, il faut se rendre dans le dossier certifiid et installer les modules node (non versionnés).<br/>
Ouvrir un invité de commande ou un shell et dans chaque dossier ou il y-a un package.json :

    npm install

Enfin il faut mettre à jour le fichier hosts de Windows (C:\Windows\System32\drivers\etc\).<br>
Ajoutez la ligne suivante.

```
127.0.0.1		local.what-is-your-opinion.com
```

## Lancement (Windows)
Pour lancer l'application il faut se rendre dans le dossier certifiid<br>
Et lancer le script `start.bat`<br>

Le site tourne sur l'adresse suivante : http://local.what-is-your-opinion.com

## Arborescence

```

  ├── frontal               - Application amorce qui route vers le site ou la frame
  |
  └── site                  - Le site [What Is Your Opinion](http://local.what-is-your-opinion.com)
```

## Mettre en ligne

https://cloudssh.developers.google.com/projects/certifiid/zones/us-central1-a/instances/mean-v4ic?authuser=0&hl=fr&projectNumber=1040047689594

- Dans ../your-opinion : 

git pull https://github.com/David-geffroy/your-opinion.git

- Verifier les processus : ps -edf | grep node
- Supprimer les processus : sudo kill -9 941
- Relancer : chmod +x start.sh puis sudo ./start.sh

## Calcul des points de crédibilité
Auteur :
-	Un commentaire publié                       +1pt
-	Le commentaire fait plus de 140 caractères	+1pt
-	Un commentaire supprimé par l'auteur        -2pts
-	Un commentaire validé par la communauté     +2pts
-	Un commentaire supprimé par la communauté   -4pts
-	Voter pour un article                       +1pt
-	Quelqu'un like mon commentaire              +0pt
-	Quelqu'un dislike mon commentaire           -0pt

Modérateur lecteur :
-	Un vote validé                              +1pt
-	Un vote invalidé                            -2pts
-	Un mauvais signalement                      -3pts
-	Un bon signalement                          +1pt

## Fonctions à developper

https://docs.google.com/spreadsheets/d/1QgghhR36tuQc161sdIXUthxIMNRh7wtrdO27Ud6H19U/edit#gid=0
Plugin Wordpress (en cours) : http://blog.netapsys.fr/publier-votre-plugin-wordpress-sur-le-site-de-la-communaute-wp/

## Trello : todo list

https://trello.com/b/9ANkfE9m/certif-iid
# your-opinion 
