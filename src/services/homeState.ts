import { prisma } from "../../prisma/db";
import { EventType } from "../enums";
import { EVENTS, eventBus } from "../utils/eventBus";

const STATE_ID = 1;

// Helper to ensure the state exists
const ensureStateExists = async () => {
	return await prisma.homeState.upsert({
		where: { id: STATE_ID },
		update: {},
		create: {
			temperature: "0",
			light: false,
			door: false,
			heat: false,
		},
	});
};

const logHistory = async (type: EventType, value: string) => {
	await prisma.history.create({
		data: {
			type,
			value,
		},
	});
	// Émission de l'événement pour les WebSockets
	eventBus.emit(EVENTS.STATE_CHANGE, { type, value });
};

export const HomeStateService = {
	get: async () => {
		return await ensureStateExists();
	},

	updateTemperature: async (temp: string) => {
		const result = await prisma.homeState.upsert({
			where: { id: STATE_ID },
			update: { temperature: temp },
			create: { temperature: temp, light: false, door: false, heat: false },
		});
		await logHistory(EventType.TEMPERATURE, temp);
		return result;
	},

	toggleLight: async () => {
		const current = await ensureStateExists();
		const newValue = !current.light;
		const result = await prisma.homeState.update({
			where: { id: STATE_ID },
			data: { light: newValue },
		});
		await logHistory(EventType.LIGHT, String(newValue));
		return result;
	},

	setLight: async (value: boolean) => {
		await ensureStateExists();
		const result = await prisma.homeState.update({
			where: { id: STATE_ID },
			data: { light: value },
		});
		await logHistory(EventType.LIGHT, String(value));
		return result;
	},

	toggleDoor: async () => {
		const current = await ensureStateExists();
		const newValue = !current.door;
		const result = await prisma.homeState.update({
			where: { id: STATE_ID },
			data: { door: newValue },
		});
		await logHistory(EventType.DOOR, String(newValue));
		return result;
	},

	setDoor: async (value: boolean) => {
		await ensureStateExists();
		const result = await prisma.homeState.update({
			where: { id: STATE_ID },
			data: { door: value },
		});
		await logHistory(EventType.DOOR, String(value));
		return result;
	},

	toggleHeat: async () => {
		const current = await ensureStateExists();
		const newValue = !current.heat;
		const result = await prisma.homeState.update({
			where: { id: STATE_ID },
			data: { heat: newValue },
		});
		await logHistory(EventType.HEAT, String(newValue));
		return result;
	},

	setHeat: async (value: boolean) => {
		await ensureStateExists();
		const result = await prisma.homeState.update({
			where: { id: STATE_ID },
			data: { heat: value },
		});
		await logHistory(EventType.HEAT, String(value));
		return result;
	},
};
