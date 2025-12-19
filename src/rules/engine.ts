import { HomeStateService } from "../services/homeState";
import { EVENTS, eventBus } from "../utils/eventBus";
import { RULES } from "./definitions";

export const initRuleEngine = () => {
	console.log("🧠 Rule Engine initialized with", RULES.length, "rules.");

	eventBus.on(EVENTS.STATE_CHANGE, async () => {
		// On récupère l'état complet à jour
		// Note: C'est léger car c'est une seule ligne en DB ou en cache
		const currentState = await HomeStateService.get();

		// Conversion pour faciliter les conditions
		const stateContext = {
			temp: Number.parseFloat(currentState.temperature),
			light: currentState.light,
			door: currentState.door,
			heat: currentState.heat,
		};

		// Évaluation des règles
		for (const rule of RULES) {
			try {
				if (rule.condition(stateContext)) {
					console.log(`⚡ Rule triggered: ${rule.id}`);
					// On exécute l'action
					// Attention: L'action va provoquer un nouvel événement STATE_CHANGE
					// Il est CRUCIAL que les conditions des règles vérifient l'état actuel pour éviter les boucles infinies
					await rule.action();
				}
			} catch (error) {
				console.error(`❌ Error executing rule ${rule.id}:`, error);
			}
		}
	});
};
