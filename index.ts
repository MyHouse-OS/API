import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

export const app = new Elysia()
	.use(
		swagger({
			documentation: {
				info: {
					title: "MyHouse OS",
					version: "1.0.0",
				},
			},
			path: "/swagger",
		}),
	)
	.group("/temp", { detail: { tags: ["Temperature"] } }, (app) =>
		app.get("/", () => "OK").post("/", () => "OK"),
	)

	.group("/toggle", { detail: { tags: ["Toggle"] } }, (app) =>
		app
			.get("/light", () => "OK")
			.post("/light", () => "OK")

			.get("/door", () => "OK")
			.post("/door", () => "OK")

			.get("/heat", () => "OK")
			.post("/heat", () => "OK"),
	)

	.group("/auth", { detail: { tags: ["Authentication"] } }, (app) =>
		app.get("/", () => "OK").post("/", () => "OK"),
	)

	.listen(3000);

console.log("🦊 serveur → http://localhost:3000");
console.log("📖 swagger UI → http://localhost:3000/swagger");
