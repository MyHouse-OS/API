import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { initRuleEngine } from "../../src/rules/engine";
import { HomeStateService } from "../../src/services/homeState";
import { EVENTS, eventBus } from "../../src/utils/eventBus";

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
		eventBus.removeAllListeners(EVENTS.STATE_CHANGE);
		initRuleEngine();
	});

	it("should turn HEAT ON when temp < 19", async () => {
		(HomeStateService.get as Mock<() => Promise<unknown>>).mockResolvedValue({
			temperature: "18",
			light: false,
			door: false,
			heat: false,
		});

		eventBus.emit(EVENTS.STATE_CHANGE, { type: "TEMP", value: "18" });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(HomeStateService.setHeat).toHaveBeenCalledWith(true);
	});

	it("should NOT turn HEAT ON if already ON", async () => {
		(HomeStateService.get as Mock<() => Promise<unknown>>).mockResolvedValue({
			temperature: "18",
			light: false,
			door: false,
			heat: true,
		});

		(HomeStateService.setHeat as Mock<() => Promise<unknown>>).mockClear();

		eventBus.emit(EVENTS.STATE_CHANGE, { type: "TEMP", value: "18" });
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(HomeStateService.setHeat).not.toHaveBeenCalled();
	});

	it("should turn LIGHT ON when Door Opens", async () => {
		(HomeStateService.get as Mock<() => Promise<unknown>>).mockResolvedValue({
			temperature: "20",
			light: false,
			door: true,
			heat: false,
		});

		eventBus.emit(EVENTS.STATE_CHANGE, { type: "DOOR", value: "true" });
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(HomeStateService.setLight).toHaveBeenCalledWith(true);
	});
});
