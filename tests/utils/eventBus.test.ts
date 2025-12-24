import { beforeEach, describe, expect, it, mock } from "bun:test";
import { EVENTS, eventBus } from "../../src/utils/eventBus";

describe("EventBus", () => {
	beforeEach(() => {
		eventBus.removeAllListeners();
	});

	it("emits STATE_CHANGE event with correct payload", () => {
		const listener = mock(() => {});

		eventBus.on(EVENTS.STATE_CHANGE, listener);
		const payload = { type: "TEMPERATURE", value: "25" };
		eventBus.emit(EVENTS.STATE_CHANGE, payload);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(payload);
	});

	it("emits NEW_CONNECTION event with correct payload", () => {
		const listener = mock(() => {});

		eventBus.on(EVENTS.NEW_CONNECTION, listener);
		const payload = { clientId: "test-client" };
		eventBus.emit(EVENTS.NEW_CONNECTION, payload);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(payload);
	});

	it("multiple listeners receive events", () => {
		const listener1 = mock(() => {});
		const listener2 = mock(() => {});
		const listener3 = mock(() => {});

		eventBus.on(EVENTS.STATE_CHANGE, listener1);
		eventBus.on(EVENTS.STATE_CHANGE, listener2);
		eventBus.on(EVENTS.STATE_CHANGE, listener3);

		const payload = { type: "LIGHT", value: "true" };
		eventBus.emit(EVENTS.STATE_CHANGE, payload);

		expect(listener1).toHaveBeenCalledTimes(1);
		expect(listener2).toHaveBeenCalledTimes(1);
		expect(listener3).toHaveBeenCalledTimes(1);
		expect(listener1).toHaveBeenCalledWith(payload);
		expect(listener2).toHaveBeenCalledWith(payload);
		expect(listener3).toHaveBeenCalledWith(payload);
	});

	it("event data is correctly passed to listeners", () => {
		const listener = mock(() => {});

		eventBus.on(EVENTS.STATE_CHANGE, listener);

		const complexPayload = {
			type: "DOOR",
			value: "false",
			timestamp: new Date().toISOString(),
			metadata: {
				source: "automation",
				ruleId: "ECO_GUARD_DOOR",
			},
		};

		eventBus.emit(EVENTS.STATE_CHANGE, complexPayload);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(complexPayload);
	});
});
