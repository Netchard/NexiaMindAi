/**
 * Templates de prompts pour le service de génération
 * Fait partie du pipeline RAG de NexiaMind AI
 */

/**
 * Rôle utilisateur pour l'adaptation des prompts
 */
export type UserRole = 'admin' | 'developer' | 'analyst' | 'user' | 'guest';

/**
 * Template de prompt avec variables
 */
export interface PromptTemplate {
  /** Rôle système (ex: 'system', 'assistant') */
  role: string;
  /** Contenu du template avec variables entre {curly braces} */
  content: string;
  /** Variables disponibles dans ce template */
  variables?: string[];
}

/**
 * Configuration des prompts par rôle
 */
export interface RolePrompts {
  /** Prompt système principal */
  system: PromptTemplate;
  /** Prompt utilisateur */
  user?: PromptTemplate;
  /** Prompt assistant */
  assistant?: PromptTemplate;
}

/**
 * Prompts système par défaut
 */
export const DEFAULT_PROMPTS: Record<UserRole, RolePrompts> = {
  admin: {
    system: {
      role: 'system',
      content: `Tu es un assistant IA expert admin pour NexiaMind. 
Tu as accès à une base de connaissances interne. 
Réponds aux questions avec précision et professionnalisme. 
Si tu ne connais pas la réponse, dis-le clairement. 

Contexte : {context}
Rôle utilisateur : {userRole}
Instructions supplémentaires : {instructions}`,
      variables: ['context', 'userRole', 'instructions'],
    },
  },
  developer: {
    system: {
      role: 'system',
      content: `Tu es un assistant technique pour les développeurs. 
        Fournis des réponses techniques précises avec des exemples de code. 
        Explique les concepts complexes de manière claire. 

      Contexte technique : {context}
      Langage préféré : {language}
      Niveau technique : {level}`,
      variables: ['context', 'language', 'level'],
    },
  },
  analyst: {
    system: {
      role: 'system',
      content: `Tu es un analyste de données pour NexiaMind. 
      Analyse les informations fournies et fournis des insights actionnables. 
      Utilise un format structuré (bullet points, tableaux). 

      Données contextuelles : {context}
      Objectif d'analyse : {objective}`,
      variables: ['context', 'objective'],
    },
  },
  user: {
    system: {
      role: 'system',
      content: `Tu es un assistant IA général pour NexiaMind.
TOUJOURS formate TES RÉPONSES en Markdown valide pour un rendu optimal dans l'interface. Le markdown ne contient pas de \n ni de " pour éviter les erreurs. 

RÈGLES PRINCIPALES :
1. Base tes réponses UNIQUEMENT sur la base de connaissances interne, SAUF si la demande commence par "dday" (d and day) : tu peux alors ajouter des informations complémentaires
2. Cite TOUJOURS tes sources avec des liens cliquables vers les documents internes
3. Utilise TOUJOURS le contexte fourni pour enrichir tes réponses
4. Sois clair, concis et utile

FORMATAGE MARKDOWN OBLIGATOIRE :
- Structure tes réponses avec des titres hiérarchiques : # Titre, ## Sous-titre, ### Section
- Utilise des listes à puces ( - ou *) pour les éléments similaires
- Formate le code dans des blocs avec triple backticks (\`\`\`) suivi du langage
- Présente les données tabulaires sous forme de tableaux Markdown
- Met en gras (**texte**) les éléments importants
- Utilise des emojis pertinents (📋, 🔍, 💡, ⚠️) dans les titres
- Regroupe TOUTES les sources dans une section "Sources et références" à la fin

EXEMPLE DE STRUCTURE :
# [📋] Titre principal

## Contexte
Texte explicatif...

## Détails
- Point 1
- Point 2

## Sources et références
- [Lien vers document 1](url)
- [Lien vers document 2](url)

Contexte : {context}`,
      variables: ['context'],
    },
  },
  guest: {
    system: {
      role: 'system',
      content: `Tu es un assistant IA pour les visiteurs. 
      Réponds aux questions générales sur NexiaMind. 
      Ne divulgue pas d'informations sensibles. 
      Tu n'as pas accès à la base de connaissances interne. 

      Contexte public : {context}`,
      variables: ['context'],
    },
  },
};

/**
 * Remplacer les variables dans un template
 * @param template Template avec variables
 * @param variables Objet de variables
 * @returns Template avec variables remplacées
 */
export function replacePromptVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, variable) => {
    return variables[variable] !== undefined ? variables[variable] : match;
  });
}

/**
 * Obtenir les prompts pour un rôle spécifique
 * @param role Rôle de l'utilisateur
 * @returns Prompts configurés pour ce rôle
 */
export function getPromptsForRole(role: UserRole): RolePrompts {
  return DEFAULT_PROMPTS[role] || DEFAULT_PROMPTS.user;
}

/**
 * Construire le prompt complet pour la génération
 * @param query Requête utilisateur
 * @param context Contexte (chunks formatés)
 * @param userRole Rôle de l'utilisateur
 * @param additionalVars Variables supplémentaires
 * @returns Messages formatés pour l'API Mistral Chat
 */
export function buildPrompt(
  query: string,
  context: string,
  userRole: UserRole = 'user',
  additionalVars: Record<string, string> = {}
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const prompts = getPromptsForRole(userRole);
  
  // Remplacer les variables dans le template système
  const systemVariables = {
    context,
    userRole,
    instructions: '',
    objective: '',
    language: 'TypeScript',
    level: 'intermediate',
    ...additionalVars,
  };
  
  const systemPrompt = replacePromptVariables(prompts.system.content, systemVariables);
  
  // Nettoyer les lignes vides et les sections de contexte vides
  const cleanedSystemPrompt = systemPrompt
    .split('\n')
    .filter(line => {
      // Garder les lignes non vides
      if (line.trim().length > 0) {
        // Exclure les lignes de contexte vides (comme "Contexte :" ou "Contexte public :")
        if (line.includes(':') && line.trim().endsWith(':')) {
          const beforeColon = line.trim().split(':')[0];
          const contextLabels = ['Contexte', 'Contexte technique', 'Données contextuelles', 'Contexte public'];
          if (contextLabels.some(label => beforeColon.includes(label)) && 
              (systemVariables.context === '' || systemVariables.context === undefined)) {
            return false; // Exclure cette ligne
          }
        }
        return true;
      }
      return false;
    })
    .join('\n');
  
  return [
    { role: 'system', content: cleanedSystemPrompt },
    { role: 'user', content: query },
  ];
}
