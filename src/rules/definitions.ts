import { HomeStateService } from "../services/homeState";

export interface Rule {
	id: string;
	description: string;
	// Retourne vrai si la règle doit se déclencher
	condition: (state: { temp: number; light: boolean; door: boolean; heat: boolean }) => boolean;
	// L'action à effectuer
	action: () => Promise<void>;
}

export const RULES: Rule[] = [
	{
		id: "HEAT_ON_COLD",
		description: "Turn on heating if temperature is below 19°C",
		condition: (state) => state.temp < 19 && !state.heat,
		action: async () => {
			console.log("❄️ Too cold! Turning heater ON.");
			await HomeStateService.setHeat(true);
		},
	},
	{
		id: "HEAT_OFF_HOT",
		description: "Turn off heating if temperature is above 23°C",
		condition: (state) => state.temp > 23 && state.heat,
		action: async () => {
			console.log("🔥 Too hot! Turning heater OFF.");
			await HomeStateService.setHeat(false);
		},
	},
	{
		id: "LIGHT_ON_ENTRY",
		description: "Turn on light if door opens and light is off",
		condition: (state) => state.door && !state.light,
		action: async () => {
			console.log("🚪 Door opened! Turning light ON.");
			await HomeStateService.setLight(true);
		},
	},
];
