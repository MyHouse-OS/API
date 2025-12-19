import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { initRuleEngine } from "../../src/rules/engine";
import { HomeStateService } from "../../src/services/homeState";
import { EVENTS, eventBus } from "../../src/utils/eventBus";

// Mock du module HomeStateService
mock.module("../../src/services/homeState", () => ({
	HomeStateService: {
		get: mock(() =>
			Promise.resolve({
				temperature: "20",
				light: false,
				door: false,
				heat: false,
			}),
		),
		setHeat: mock(() => Promise.resolve({} as never)),
		setLight: mock(() => Promise.resolve({} as never)),
		setDoor: mock(() => Promise.resolve({} as never)),
		updateTemperature: mock(() => Promise.resolve({} as never)),
	},
}));

describe("Rule Engine", async () => {
	beforeEach(() => {
		// Nettoyage des listeners précédents pour éviter les doublons/fuites
		eventBus.removeAllListeners(EVENTS.STATE_CHANGE);
		initRuleEngine();
	});

	it("should turn HEAT ON when temp < 19", async () => {
		// Mock state: Temp 18 (froid), Heat OFF
		(HomeStateService.get as Mock).mockResolvedValue({
			temperature: "18",
			light: false,
			door: false,
			heat: false, // OFF -> Doit s'allumer
		});

		eventBus.emit(EVENTS.STATE_CHANGE, { type: "TEMP", value: "18" });

		// Petit délai pour laisser la promesse se résoudre
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(HomeStateService.setHeat).toHaveBeenCalledWith(true);
	});

	it("should NOT turn HEAT ON if already ON", async () => {
		// Mock state: Temp 18, Heat ON
		(HomeStateService.get as Mock).mockResolvedValue({
			temperature: "18",
			light: false,
			door: false,
			heat: true, // Déjà ON
		});

		(HomeStateService.setHeat as Mock).mockClear();

		eventBus.emit(EVENTS.STATE_CHANGE, { type: "TEMP", value: "18" });
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(HomeStateService.setHeat).not.toHaveBeenCalled();
	});

	it("should turn LIGHT ON when Door Opens", async () => {
		// Mock state: Porte Ouverte, Lumière Eteinte
		(HomeStateService.get as Mock).mockResolvedValue({
			temperature: "20",
			light: false, // OFF -> Doit s'allumer
			door: true, // OPEN
			heat: false,
		});

		eventBus.emit(EVENTS.STATE_CHANGE, { type: "DOOR", value: "true" });
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(HomeStateService.setLight).toHaveBeenCalledWith(true);
	});
});
