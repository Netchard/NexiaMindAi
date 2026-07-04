 ULTIMATE BMad Method STORY CONTEXT CREATED, Dday !

Détails de la story :

Story ID : ST-303 (4.303)
Story Key : 4-303-creer-l-interface-de-chat
Fichier : 4-303-creer-l-interface-de-chat.md
Statut : ready-for-dev
Ce que l'analyse exhaustive a révélé (au-delà d'une simple recopie de l'epic) :

Bloqueur critique dans le backend existant : GET /api/chat/history utilise head: true sur sa requête Supabase — ce qui fait qu'elle ne renvoie jamais de conversations (uniquement un count), et dès qu'on corrige ça, un second bug apparaît (.group() n'existe pas sur le client Supabase JS — confirmé par tsc). Sans correction, l'AC "historique des conversations" est impossible à satisfaire. → Task 0, prérequis bloquant.
Piège évité de justesse : les fichiers route.ts existants exportent déjà des helpers sendChatMessage/getChatHistory qui semblent prêts à réutiliser — mais ce sont des modules serveur (next/server, variables d'env non préfixées) : les importer côté client ferait planter la page au chargement. J'ai failli le recommander moi-même avant de le détecter en auto-validation ; la story prescrit maintenant leur suppression et l'écriture d'un client fetch neuf.
Aucune spec UX pour le chat (contrairement à l'auth) — signalé comme question ouverte, avec une convention de repli sensée (Tailwind générique, pas les tokens auth-*).
Navbar n'a pas de lien vers /chat — ajouté comme tâche explicite, sinon la page serait livrée mais inatteignable.
Écarts entre architecture.md (mentionne react-markdown, i18next, Zustand) et les conventions réelles du projet (aucun des trois n'est utilisé) — la story suit les conventions réelles, pas le doc théorique.
Prochaines étapes :

Revoir la story dans le fichier ci-dessus
dev-story pour l'implémentation
code-review une fois terminé
