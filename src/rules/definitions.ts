import { HomeStateService } from "../services/homeState";

export interface Rule {
	id: string;
	description: string;
	condition: (state: { temp: number; light: boolean; door: boolean; heat: boolean }) => boolean;
	action: () => Promise<void>;
}

export const RULES: Rule[] = [
	{
		id: "HEAT_ON_COLD",
		description: "Turn on heating if temperature is below 19°C AND door is closed",
		condition: (state) => state.temp < 19 && !state.heat && !state.door,
		action: async () => {
			console.log("❄️ Too cold & Door closed. Turning heater ON.");
			await HomeStateService.setHeat(true);
		},
	},
	{
		id: "HEAT_OFF_HOT",
		description: "Turn off heating if temperature is above 23°C",
		condition: (state) => state.temp > 23 && state.heat,
		action: async () => {
			console.log("🔥 Comfortable enough (>23°C). Turning heater OFF.");
			await HomeStateService.setHeat(false);
		},
	},
	{
		id: "LIGHT_ON_ENTRY",
		description: "Turn on light if door opens and light is off",
		condition: (state) => state.door && !state.light,
		action: async () => {
			console.log("🚪 Door opened! Welcome home. Turning light ON.");
			await HomeStateService.setLight(true);
		},
	},
	{
		id: "ECO_GUARD_DOOR",
		description: "Energy Saver: Turn off heat if door is left open",
		condition: (state) => state.door && state.heat,
		action: async () => {
			console.log("💸 Money flying out the door! Eco-Guard: Turning heat OFF.");
			await HomeStateService.setHeat(false);
		},
	},
];
