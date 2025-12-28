import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

let currentAuthorization = "";

export function setAuthorization(auth: string) {
	currentAuthorization = auth;
}

async function apiCall(
	endpoint: string,
	method: "GET" | "POST",
	body?: Record<string, unknown>,
): Promise<Response> {
	const options: RequestInit = {
		method,
		headers: {
			Authorization: currentAuthorization,
			"Content-Type": "application/json",
		},
	};

	if (body) {
		options.body = JSON.stringify(body);
	}

	return fetch(`${API_BASE_URL}${endpoint}`, options);
}

export const tools = {
	toggle_light: {
		description: "Toggle the light on or off.",
		inputSchema: z.object({}),
		handler: async () => {
			const response = await apiCall("/toggle/light", "POST");
			const data = (await response.json()) as { light: boolean; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to toggle light");
			}

			return {
				success: true,
				light: data.light,
				message: data.light ? "Light is now ON" : "Light is now OFF",
			};
		},
	},

	toggle_door: {
		description: "Open or close the door.",
		inputSchema: z.object({}),
		handler: async () => {
			const response = await apiCall("/toggle/door", "POST");
			const data = (await response.json()) as { door: boolean; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to toggle door");
			}

			return {
				success: true,
				door: data.door,
				message: data.door ? "Door is now OPEN" : "Door is now CLOSED",
			};
		},
	},

	toggle_heat: {
		description: "Turn the heating on or off.",
		inputSchema: z.object({}),
		handler: async () => {
			const response = await apiCall("/toggle/heat", "POST");
			const data = (await response.json()) as { heat: boolean; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to toggle heat");
			}

			return {
				success: true,
				heat: data.heat,
				message: data.heat ? "Heating is now ON" : "Heating is now OFF",
			};
		},
	},

	set_temperature: {
		description: "Set the current temperature reading (e.g., from a sensor).",
		inputSchema: z.object({
			temp: z.string().describe("Temperature value as string (e.g., '23.5')"),
		}),
		handler: async (args: { temp: string }) => {
			const response = await apiCall("/temp", "POST", { temp: args.temp });
			const data = (await response.json()) as { temp: string; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Failed to set temperature");
			}

			return {
				success: true,
				temperature: data.temp,
				message: `Temperature set to ${data.temp}`,
			};
		},
	},

	get_home_state: {
		description:
			"Get the current state of the home including temperature, light, door, and heating status.",
		inputSchema: z.object({}),
		handler: async () => {
			const [lightRes, doorRes, heatRes, tempRes] = await Promise.all([
				apiCall("/toggle/light", "GET"),
				apiCall("/toggle/door", "GET"),
				apiCall("/toggle/heat", "GET"),
				apiCall("/temp", "GET"),
			]);

			const [lightData, doorData, heatData, tempData] = (await Promise.all([
				lightRes.json(),
				doorRes.json(),
				heatRes.json(),
				tempRes.json(),
			])) as [{ light: boolean }, { door: boolean }, { heat: boolean }, { temp: string }];

			return {
				temperature: tempData.temp,
				light: lightData.light,
				door: doorData.door,
				heat: heatData.heat,
			};
		},
	},

	get_history: {
		description: "Get the history of home events (temperature changes, light/door/heat toggles).",
		inputSchema: z.object({
			limit: z
				.number()
				.optional()
				.default(50)
				.describe("Number of events to retrieve (default: 50)"),
		}),
		handler: async (args: { limit?: number }) => {
			const limit = args.limit ?? 50;
			const response = await apiCall(`/history?limit=${limit}`, "GET");
			const data = (await response.json()) as {
				data: { type: string; value: string; createdAt: string }[];
				count: number;
				error?: string;
			};

			if (!response.ok) {
				throw new Error(data.error || "Failed to get history");
			}

			return {
				count: data.count,
				events: data.data.map((event) => ({
					type: event.type,
					value: event.value,
					createdAt: event.createdAt,
				})),
			};
		},
	},
};
