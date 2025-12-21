import { HomeStateService } from "../services/homeState";
import { EVENTS, eventBus } from "../utils/eventBus";
import { RULES } from "./definitions";

export const initRuleEngine = () => {
	console.log("🧠 Rule Engine initialized with", RULES.length, "rules.");

	eventBus.on(EVENTS.STATE_CHANGE, async () => {
		const currentState = await HomeStateService.get();

		const stateContext = {
			temp: Number.parseFloat(currentState.temperature),
			light: currentState.light,
			door: currentState.door,
			heat: currentState.heat,
		};

		for (const rule of RULES) {
			try {
				if (rule.condition(stateContext)) {
					console.log(`⚡ Rule triggered: ${rule.id}`);
					await rule.action();
				}
			} catch (error) {
				console.error(`❌ Error executing rule ${rule.id}:`, error);
			}
		}
	});
};
