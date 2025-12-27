import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";

const mockHomeStateService = {
	setHeat: mock(() => Promise.resolve({})),
	setLight: mock(() => Promise.resolve({})),
};

mock.module("../../src/services/homeState", () => ({
	HomeStateService: mockHomeStateService,
}));

describe("Rule Definitions", async () => {
	const { RULES } = await import("../../src/rules/definitions");

	beforeEach(() => {
		(mockHomeStateService.setHeat as Mock<() => Promise<unknown>>).mockClear();
		(mockHomeStateService.setLight as Mock<() => Promise<unknown>>).mockClear();
	});

	describe("HEAT_ON_COLD rule", () => {
		const heatOnColdRule = RULES.find((r) => r.id === "HEAT_ON_COLD");

		it("triggers when temp < 19 and heat is OFF and door is closed", async () => {
			expect(heatOnColdRule).toBeDefined();
			const state = { temp: 18, heat: false, light: false, door: false };
			const shouldTrigger = heatOnColdRule?.condition(state);

			expect(shouldTrigger).toBe(true);

			await heatOnColdRule?.action();
			expect(mockHomeStateService.setHeat).toHaveBeenCalledWith(true);
		});

		it("does NOT trigger when door is open (energy saving)", async () => {
			expect(heatOnColdRule).toBeDefined();
			const state = { temp: 18, heat: false, light: false, door: true };
			const shouldTrigger = heatOnColdRule?.condition(state);

			expect(shouldTrigger).toBe(false);
		});

		it("does NOT trigger when temp is exactly 19°C (edge case)", () => {
			expect(heatOnColdRule).toBeDefined();
			const state = { temp: 19, heat: false, light: false, door: false };
			const shouldTrigger = heatOnColdRule?.condition(state);

			expect(shouldTrigger).toBe(false);
		});
	});

	describe("HEAT_OFF_HOT rule", () => {
		const heatOffHotRule = RULES.find((r) => r.id === "HEAT_OFF_HOT");

		it("triggers when temp > 23 and heat is ON", async () => {
			expect(heatOffHotRule).toBeDefined();
			const state = { temp: 24, heat: true, light: false, door: false };
			const shouldTrigger = heatOffHotRule?.condition(state);

			expect(shouldTrigger).toBe(true);

			await heatOffHotRule?.action();
			expect(mockHomeStateService.setHeat).toHaveBeenCalledWith(false);
		});

		it("does NOT trigger when heat is already OFF", () => {
			expect(heatOffHotRule).toBeDefined();
			const state = { temp: 25, heat: false, light: false, door: false };
			const shouldTrigger = heatOffHotRule?.condition(state);

			expect(shouldTrigger).toBe(false);
		});

		it("does NOT trigger when temp is exactly 23°C (edge case)", () => {
			expect(heatOffHotRule).toBeDefined();
			const state = { temp: 23, heat: true, light: false, door: false };
			const shouldTrigger = heatOffHotRule?.condition(state);

			expect(shouldTrigger).toBe(false);
		});
	});

	describe("LIGHT_ON_ENTRY rule", () => {
		const lightOnEntryRule = RULES.find((r) => r.id === "LIGHT_ON_ENTRY");

		it("triggers when door opens and light is OFF", async () => {
			expect(lightOnEntryRule).toBeDefined();
			const state = { temp: 20, heat: false, light: false, door: true };
			const shouldTrigger = lightOnEntryRule?.condition(state);

			expect(shouldTrigger).toBe(true);

			await lightOnEntryRule?.action();
			expect(mockHomeStateService.setLight).toHaveBeenCalledWith(true);
		});

		it("does NOT trigger when light is already ON", () => {
			expect(lightOnEntryRule).toBeDefined();
			const state = { temp: 20, heat: false, light: true, door: true };
			const shouldTrigger = lightOnEntryRule?.condition(state);

			expect(shouldTrigger).toBe(false);
		});
	});

	describe("ECO_GUARD_DOOR rule", () => {
		const ecoGuardRule = RULES.find((r) => r.id === "ECO_GUARD_DOOR");

		it("triggers when door is open and heat is ON (energy saver)", async () => {
			expect(ecoGuardRule).toBeDefined();
			const state = { temp: 20, heat: true, light: false, door: true };
			const shouldTrigger = ecoGuardRule?.condition(state);

			expect(shouldTrigger).toBe(true);

			await ecoGuardRule?.action();
			expect(mockHomeStateService.setHeat).toHaveBeenCalledWith(false);
		});

		it("does NOT trigger when heat is already OFF", () => {
			expect(ecoGuardRule).toBeDefined();
			const state = { temp: 20, heat: false, light: false, door: true };
			const shouldTrigger = ecoGuardRule?.condition(state);

			expect(shouldTrigger).toBe(false);
		});

		it("does NOT trigger when door is closed", () => {
			expect(ecoGuardRule).toBeDefined();
			const state = { temp: 20, heat: true, light: false, door: false };
			const shouldTrigger = ecoGuardRule?.condition(state);

			expect(shouldTrigger).toBe(false);
		});
	});
});
